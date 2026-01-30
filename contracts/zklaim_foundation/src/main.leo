// ZKLAIM Foundation Contract
// First deployed contract for the ZKLAIM protocol
// Handles protocol initialization and provides utility functions

program zklaim_foundation.aleo {

    // =============================================
    // MAPPINGS (Public on-chain state)
    // =============================================

    // Protocol configuration
    mapping protocol_initialized: u8 => bool;
    mapping protocol_admin: u8 => address;
    mapping protocol_version: u8 => u32;

    // User registration (maps address hash to registration status)
    mapping registered_users: field => bool;
    mapping user_count: u8 => u64;

    // Simple key-value store for testing
    mapping test_storage: field => field;

    // =============================================
    // CONSTANTS
    // =============================================

    // Single key for global values (we use u8 key = 0 for singleton mappings)
    const GLOBAL_KEY: u8 = 0u8;

    // Protocol version (1.0.0 = 10000)
    const CURRENT_VERSION: u32 = 10000u32;

    // =============================================
    // STRUCTS
    // =============================================

    // Protocol info returned by queries
    struct ProtocolInfo {
        version: u32,
        is_initialized: bool,
    }

    // =============================================
    // CONSTRUCTOR (required for deployment)
    // =============================================

    // Non-upgradable constructor - program is immutable after deployment
    @noupgrade
    async constructor() {
        // Leo compiler automatically generates the constructor logic
    }

    // =============================================
    // ADMIN FUNCTIONS
    // =============================================

    // Initialize the protocol (can only be called once)
    async transition initialize_protocol(admin: address) -> Future {
        return finalize_initialize_protocol(admin);
    }

    async function finalize_initialize_protocol(admin: address) {
        // Check not already initialized
        let already_init: bool = Mapping::get_or_use(protocol_initialized, GLOBAL_KEY, false);
        assert(!already_init);

        // Set initialized
        Mapping::set(protocol_initialized, GLOBAL_KEY, true);
        Mapping::set(protocol_admin, GLOBAL_KEY, admin);
        Mapping::set(protocol_version, GLOBAL_KEY, CURRENT_VERSION);
        Mapping::set(user_count, GLOBAL_KEY, 0u64);
    }

    // =============================================
    // USER FUNCTIONS
    // =============================================

    // Register a user (for testing wallet integration)
    async transition register_user() -> Future {
        return finalize_register_user(self.caller);
    }

    async function finalize_register_user(caller: address) {
        // Hash the address to use as key
        let user_hash: field = BHP256::hash_to_field(caller);

        // Check not already registered
        let already_registered: bool = Mapping::get_or_use(registered_users, user_hash, false);
        assert(!already_registered);

        // Register user
        Mapping::set(registered_users, user_hash, true);

        // Increment user count
        let current_count: u64 = Mapping::get_or_use(user_count, GLOBAL_KEY, 0u64);
        Mapping::set(user_count, GLOBAL_KEY, current_count + 1u64);
    }

    // Check if caller is registered (returns proof)
    async transition verify_registration() -> (bool, Future) {
        return (true, finalize_verify_registration(self.caller));
    }

    async function finalize_verify_registration(caller: address) {
        let user_hash: field = BHP256::hash_to_field(caller);
        let is_registered: bool = Mapping::get_or_use(registered_users, user_hash, false);
        assert(is_registered);
    }

    // =============================================
    // UTILITY FUNCTIONS (for testing)
    // =============================================

    // Store a value (tests write operations)
    async transition store_value(key: field, value: field) -> Future {
        return finalize_store_value(key, value);
    }

    async function finalize_store_value(key: field, value: field) {
        Mapping::set(test_storage, key, value);
    }

    // Simple ping function (tests basic transaction)
    transition ping() -> u32 {
        return CURRENT_VERSION;
    }

    // Echo function (tests input/output)
    transition echo(value: field) -> field {
        return value;
    }

    // Add two numbers (tests computation)
    transition sum(a: u64, b: u64) -> u64 {
        return a + b;
    }
}
