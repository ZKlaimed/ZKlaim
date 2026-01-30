program zklaim_foundation.aleo;

mapping protocol_initialized:
    key as u8.public;
    value as boolean.public;

mapping protocol_admin:
    key as u8.public;
    value as address.public;

mapping protocol_version:
    key as u8.public;
    value as u32.public;

mapping registered_users:
    key as field.public;
    value as boolean.public;

mapping user_count:
    key as u8.public;
    value as u64.public;

mapping test_storage:
    key as field.public;
    value as field.public;

function initialize_protocol:
    input r0 as address.private;
    async initialize_protocol r0 into r1;
    output r1 as zklaim_foundation.aleo/initialize_protocol.future;

finalize initialize_protocol:
    input r0 as address.public;
    get.or_use protocol_initialized[0u8] false into r1;
    not r1 into r2;
    assert.eq r2 true;
    set true into protocol_initialized[0u8];
    set r0 into protocol_admin[0u8];
    set 10000u32 into protocol_version[0u8];
    set 0u64 into user_count[0u8];

function register_user:
    async register_user self.caller into r0;
    output r0 as zklaim_foundation.aleo/register_user.future;

finalize register_user:
    input r0 as address.public;
    hash.bhp256 r0 into r1 as field;
    get.or_use registered_users[r1] false into r2;
    not r2 into r3;
    assert.eq r3 true;
    set true into registered_users[r1];
    get.or_use user_count[0u8] 0u64 into r4;
    add r4 1u64 into r5;
    set r5 into user_count[0u8];

function verify_registration:
    async verify_registration self.caller into r0;
    output true as boolean.private;
    output r0 as zklaim_foundation.aleo/verify_registration.future;

finalize verify_registration:
    input r0 as address.public;
    hash.bhp256 r0 into r1 as field;
    get.or_use registered_users[r1] false into r2;
    assert.eq r2 true;

function store_value:
    input r0 as field.private;
    input r1 as field.private;
    async store_value r0 r1 into r2;
    output r2 as zklaim_foundation.aleo/store_value.future;

finalize store_value:
    input r0 as field.public;
    input r1 as field.public;
    set r1 into test_storage[r0];

function ping:
    output 10000u32 as u32.private;

function echo:
    input r0 as field.private;
    output r0 as field.private;

function sum:
    input r0 as u64.private;
    input r1 as u64.private;
    add r0 r1 into r2;
    output r2 as u64.private;
