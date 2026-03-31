#!/usr/bin/env python3
"""
Fix Initia rollup genesis to have enough GAS tokens for contract deployment.
Run after stopping the rollup and before restarting.

Usage:
  python3 scripts/fix-genesis.py
  rm -rf ~/.minitia/data
  weave rollup start
"""
import json
import os
import shutil

GENESIS_PATH = os.path.expanduser("~/.minitia/config/genesis.json")
BACKUP_PATH = GENESIS_PATH + ".bak"

# 1 billion GAS in base units (18 decimals)
GENESIS_BALANCE = "1000000000000000000000000000"  # 1e27 = 1 billion GAS

print(f"Reading {GENESIS_PATH}...")
with open(GENESIS_PATH) as f:
    genesis = json.load(f)

# Backup
shutil.copy2(GENESIS_PATH, BACKUP_PATH)
print(f"Backed up to {BACKUP_PATH}")

# Fix balances
balances = genesis["app_state"]["bank"]["balances"]
for b in balances:
    if b["coins"]:
        old = b["coins"][0]["amount"]
        b["coins"][0]["amount"] = GENESIS_BALANCE
        print(f"  {b['address']}: {old} -> {GENESIS_BALANCE} GAS")

# Fix supply
genesis["app_state"]["bank"]["supply"] = [
    {"denom": "GAS", "amount": str(int(GENESIS_BALANCE) * len([b for b in balances if b["coins"]]))}
]

with open(GENESIS_PATH, "w") as f:
    json.dump(genesis, f, indent=2)

print(f"\nGenesis updated. Now run:")
print(f"  rm -rf ~/.minitia/data")
print(f"  weave rollup start")
