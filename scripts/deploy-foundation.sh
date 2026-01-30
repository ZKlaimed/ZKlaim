#!/bin/bash
# ZKLAIM Foundation Contract Deployment Script
# Deploys zklaim_foundation.aleo to Aleo testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ZKLAIM Foundation Contract Deployment ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Leo CLI is installed
if ! command -v leo &> /dev/null; then
    echo -e "${RED}Error: Leo CLI is not installed${NC}"
    echo "Install it with: curl -sSf https://install.leo.build/ | sh"
    exit 1
fi

echo -e "${GREEN}✓ Leo CLI found: $(leo --version)${NC}"

# Navigate to contract directory
CONTRACT_DIR="$(dirname "$0")/../contracts/zklaim_foundation"

if [ ! -d "$CONTRACT_DIR" ]; then
    echo -e "${RED}Error: Contract directory not found at $CONTRACT_DIR${NC}"
    exit 1
fi

cd "$CONTRACT_DIR"
echo -e "${GREEN}✓ Working directory: $(pwd)${NC}"
echo ""

# Build the contract
echo -e "${YELLOW}Building contract...${NC}"
leo build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

# Run tests (optional - uncomment if tests are set up)
# echo -e "${YELLOW}Running tests...${NC}"
# leo test
# if [ $? -eq 0 ]; then
#     echo -e "${GREEN}✓ All tests passed${NC}"
# else
#     echo -e "${RED}✗ Tests failed${NC}"
#     exit 1
# fi
# echo ""

# Deploy to testnet
echo -e "${YELLOW}Deploying to testnet...${NC}"
echo -e "${YELLOW}Note: This requires an Aleo account with testnet credits${NC}"
echo ""

# Check if ALEO_PRIVATE_KEY is set
if [ -z "$ALEO_PRIVATE_KEY" ]; then
    echo -e "${RED}Error: ALEO_PRIVATE_KEY environment variable is not set${NC}"
    echo ""
    echo "To deploy, you need:"
    echo "1. An Aleo account with testnet credits"
    echo "2. Set the private key: export ALEO_PRIVATE_KEY=your_private_key"
    echo ""
    echo "Get testnet credits from: https://faucet.aleo.org/"
    echo ""
    echo -e "${YELLOW}Skipping deployment - build completed successfully${NC}"
    exit 0
fi

# Deploy
leo deploy --network testnet

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment Successful!                ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Save the program ID for frontend configuration"
    echo "2. Update FOUNDATION_PROGRAM_ID in lib/aleo/foundation.ts"
    echo "3. Verify the contract on Aleo Explorer"
    echo ""
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
