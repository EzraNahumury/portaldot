#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod guardian_vault {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    pub type RequestId = u64;

    #[derive(Debug, Clone, scale::Encode, scale::Decode, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct RecoveryRequest {
        pub id: RequestId,
        pub proposed_owner: AccountId,
        pub approvals: Vec<AccountId>,
        pub requested_at: Timestamp,
    }

    #[ink(storage)]
    pub struct GuardianVault {
        owner: AccountId,
        guardians: Vec<AccountId>,
        threshold: u8,
        timelock_seconds: u64,
        active_recovery: Option<RecoveryRequest>,
        next_request_id: RequestId,
        is_guardian: Mapping<AccountId, ()>,
    }

    #[ink(event)]
    pub struct VaultCreated {
        #[ink(topic)]
        owner: AccountId,
        threshold: u8,
        guardian_count: u32,
    }

    #[ink(event)]
    pub struct RecoveryRequested {
        #[ink(topic)]
        request_id: RequestId,
        #[ink(topic)]
        proposed_owner: AccountId,
        by: AccountId,
    }

    #[ink(event)]
    pub struct RecoveryApproved {
        #[ink(topic)]
        request_id: RequestId,
        #[ink(topic)]
        guardian: AccountId,
        approvals: u8,
    }

    #[ink(event)]
    pub struct RecoveryExecuted {
        #[ink(topic)]
        request_id: RequestId,
        old_owner: AccountId,
        new_owner: AccountId,
    }

    #[ink(event)]
    pub struct RecoveryCancelled {
        #[ink(topic)]
        request_id: RequestId,
    }

    #[ink(event)]
    pub struct GuardianAdded {
        #[ink(topic)]
        guardian: AccountId,
    }

    #[ink(event)]
    pub struct GuardianRemoved {
        #[ink(topic)]
        guardian: AccountId,
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        NotOwner,
        NotGuardian,
        InvalidThreshold,
        DuplicateGuardian,
        GuardianNotFound,
        NoActiveRecovery,
        RecoveryAlreadyActive,
        AlreadyApproved,
        ThresholdNotMet,
        TimelockNotElapsed,
        EmptyGuardians,
        TooManyGuardians,
        WrongRequestId,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl GuardianVault {
        #[ink(constructor)]
        pub fn new(
            guardians: Vec<AccountId>,
            threshold: u8,
            timelock_seconds: u64,
        ) -> Result<Self> {
            if guardians.is_empty() {
                return Err(Error::EmptyGuardians);
            }
            if guardians.len() > 32 {
                return Err(Error::TooManyGuardians);
            }
            if threshold == 0 || threshold as usize > guardians.len() {
                return Err(Error::InvalidThreshold);
            }

            let mut is_guardian = Mapping::default();
            for g in guardians.iter() {
                if is_guardian.contains(g) {
                    return Err(Error::DuplicateGuardian);
                }
                is_guardian.insert(g, &());
            }

            let caller = Self::env().caller();
            let guardian_count = guardians.len() as u32;
            let instance = Self {
                owner: caller,
                guardians,
                threshold,
                timelock_seconds,
                active_recovery: None,
                next_request_id: 1,
                is_guardian,
            };

            Self::env().emit_event(VaultCreated {
                owner: caller,
                threshold,
                guardian_count,
            });
            Ok(instance)
        }

        #[ink(message)]
        pub fn request_recovery(&mut self, proposed_owner: AccountId) -> Result<RequestId> {
            if self.active_recovery.is_some() {
                return Err(Error::RecoveryAlreadyActive);
            }
            let id = self.next_request_id;
            self.next_request_id = self.next_request_id.saturating_add(1);

            let req = RecoveryRequest {
                id,
                proposed_owner,
                approvals: Vec::new(),
                requested_at: Self::env().block_timestamp(),
            };
            self.active_recovery = Some(req);

            Self::env().emit_event(RecoveryRequested {
                request_id: id,
                proposed_owner,
                by: Self::env().caller(),
            });
            Ok(id)
        }

        #[ink(message)]
        pub fn approve_recovery(&mut self, request_id: RequestId) -> Result<()> {
            let caller = Self::env().caller();
            if !self.is_guardian.contains(caller) {
                return Err(Error::NotGuardian);
            }
            let req = self
                .active_recovery
                .as_mut()
                .ok_or(Error::NoActiveRecovery)?;
            if req.id != request_id {
                return Err(Error::WrongRequestId);
            }
            if req.approvals.iter().any(|a| a == &caller) {
                return Err(Error::AlreadyApproved);
            }
            req.approvals.push(caller);
            let approvals = req.approvals.len() as u8;

            Self::env().emit_event(RecoveryApproved {
                request_id,
                guardian: caller,
                approvals,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn execute_recovery(&mut self, request_id: RequestId) -> Result<()> {
            let req = self
                .active_recovery
                .as_ref()
                .ok_or(Error::NoActiveRecovery)?;
            if req.id != request_id {
                return Err(Error::WrongRequestId);
            }
            if (req.approvals.len() as u8) < self.threshold {
                return Err(Error::ThresholdNotMet);
            }
            let now = Self::env().block_timestamp();
            let elapsed_ms = now.saturating_sub(req.requested_at);
            let timelock_ms = self.timelock_seconds.saturating_mul(1_000);
            if elapsed_ms < timelock_ms {
                return Err(Error::TimelockNotElapsed);
            }

            let old_owner = self.owner;
            let new_owner = req.proposed_owner;
            self.owner = new_owner;
            self.active_recovery = None;

            Self::env().emit_event(RecoveryExecuted {
                request_id,
                old_owner,
                new_owner,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn cancel_recovery(&mut self, request_id: RequestId) -> Result<()> {
            self.ensure_owner()?;
            let req = self
                .active_recovery
                .as_ref()
                .ok_or(Error::NoActiveRecovery)?;
            if req.id != request_id {
                return Err(Error::WrongRequestId);
            }
            self.active_recovery = None;
            Self::env().emit_event(RecoveryCancelled { request_id });
            Ok(())
        }

        #[ink(message)]
        pub fn add_guardian(&mut self, guardian: AccountId) -> Result<()> {
            self.ensure_owner()?;
            if self.is_guardian.contains(guardian) {
                return Err(Error::DuplicateGuardian);
            }
            if self.guardians.len() >= 32 {
                return Err(Error::TooManyGuardians);
            }
            self.guardians.push(guardian);
            self.is_guardian.insert(guardian, &());
            Self::env().emit_event(GuardianAdded { guardian });
            Ok(())
        }

        #[ink(message)]
        pub fn remove_guardian(&mut self, guardian: AccountId) -> Result<()> {
            self.ensure_owner()?;
            if !self.is_guardian.contains(guardian) {
                return Err(Error::GuardianNotFound);
            }
            self.guardians.retain(|g| g != &guardian);
            self.is_guardian.remove(guardian);
            if self.threshold as usize > self.guardians.len() {
                self.threshold = self.guardians.len() as u8;
            }
            Self::env().emit_event(GuardianRemoved { guardian });
            Ok(())
        }

        #[ink(message)]
        pub fn set_threshold(&mut self, new_threshold: u8) -> Result<()> {
            self.ensure_owner()?;
            if new_threshold == 0 || new_threshold as usize > self.guardians.len() {
                return Err(Error::InvalidThreshold);
            }
            self.threshold = new_threshold;
            Ok(())
        }

        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        #[ink(message)]
        pub fn get_guardians(&self) -> Vec<AccountId> {
            self.guardians.clone()
        }

        #[ink(message)]
        pub fn get_threshold(&self) -> u8 {
            self.threshold
        }

        #[ink(message)]
        pub fn get_timelock_seconds(&self) -> u64 {
            self.timelock_seconds
        }

        #[ink(message)]
        pub fn get_active_recovery(&self) -> Option<RecoveryRequest> {
            self.active_recovery.clone()
        }

        fn ensure_owner(&self) -> Result<()> {
            if Self::env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        fn accounts() -> ink::env::test::DefaultAccounts<ink::env::DefaultEnvironment> {
            ink::env::test::default_accounts::<ink::env::DefaultEnvironment>()
        }

        fn set_caller(caller: AccountId) {
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(caller);
        }

        #[ink::test]
        fn constructor_works() {
            let acc = accounts();
            set_caller(acc.alice);
            let vault = GuardianVault::new(
                vec![acc.bob, acc.charlie, acc.django],
                2,
                86_400,
            )
            .expect("constructor ok");
            assert_eq!(vault.get_owner(), acc.alice);
            assert_eq!(vault.get_threshold(), 2);
            assert_eq!(vault.get_guardians().len(), 3);
        }

        #[ink::test]
        fn rejects_invalid_threshold() {
            let acc = accounts();
            set_caller(acc.alice);
            let res = GuardianVault::new(vec![acc.bob], 2, 86_400);
            assert_eq!(res.unwrap_err(), Error::InvalidThreshold);
        }

        #[ink::test]
        fn happy_path_recovery() {
            let acc = accounts();
            set_caller(acc.alice);
            let mut vault = GuardianVault::new(
                vec![acc.bob, acc.charlie, acc.django],
                2,
                0,
            )
            .unwrap();

            set_caller(acc.eve);
            let id = vault.request_recovery(acc.eve).unwrap();

            set_caller(acc.bob);
            vault.approve_recovery(id).unwrap();
            set_caller(acc.charlie);
            vault.approve_recovery(id).unwrap();

            vault.execute_recovery(id).unwrap();
            assert_eq!(vault.get_owner(), acc.eve);
        }

        #[ink::test]
        fn non_guardian_cannot_approve() {
            let acc = accounts();
            set_caller(acc.alice);
            let mut vault = GuardianVault::new(
                vec![acc.bob, acc.charlie],
                2,
                0,
            )
            .unwrap();

            set_caller(acc.eve);
            let id = vault.request_recovery(acc.eve).unwrap();

            set_caller(acc.frank);
            assert_eq!(vault.approve_recovery(id).unwrap_err(), Error::NotGuardian);
        }

        #[ink::test]
        fn owner_can_cancel() {
            let acc = accounts();
            set_caller(acc.alice);
            let mut vault = GuardianVault::new(
                vec![acc.bob, acc.charlie],
                1,
                0,
            )
            .unwrap();

            set_caller(acc.eve);
            let id = vault.request_recovery(acc.eve).unwrap();

            set_caller(acc.alice);
            vault.cancel_recovery(id).unwrap();
            assert!(vault.get_active_recovery().is_none());
        }
    }
}
