import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import { BullishBear, Transfer } from "./entities/BullishBear/BullishBear";
import { Bear, Account } from "./entities/schema";

export function handleBearTransfer(event: Transfer): void {
  if (event.params.tokenId.toString() == "") return;

  if (isMint(event)) {
    let bear = new Bear(getBearId(event.params.tokenId));
    bear.tokenId = event.params.tokenId;
    bear.tokenURI = getTokenURI(event);
    createAccount(event.params.to);
    bear.account = event.params.to.toHexString();
    bear.save();
  } else {
    let bear = Bear.load(getBearId(event.params.tokenId));
    createAccount(event.params.to);
    bear.account = event.params.to.toHexString();
    bear.save();

    let account = Account.load(event.params.from.toHexString());
    account.balance = account.balance.minus(BigInt.fromI32(1));
    account.save();
  }

  let account = Account.load(event.params.to.toHexString());
  account.balance = account.balance.plus(BigInt.fromI32(1));
  account.save();
}

function createAccount(addr: Address): void {
  let account = Account.load(addr.toHexString());

  if (account == null) {
    account = new Account(addr.toHexString());
    account.address = addr;
    account.balance = BigInt.fromI32(0);
  }

  account.save();
}

function getBearId(id: BigInt): string {
  return "BullishBears - " + id.toString();
}

function isMint(event: Transfer): boolean {
  return (
    event.params.from.toHexString() ==
    "0x0000000000000000000000000000000000000000"
  );
}

function getTokenURI(event: Transfer): string {
  let bear = BullishBear.bind(event.address);
  let tokenURICallResult = bear.try_tokenURI(event.params.tokenId);
  let tokenURI = "";

  if (tokenURICallResult.reverted) {
    log.warning("tokenURI reverted for tokenID: {} contract: {}", [
      event.params.tokenId.toString(),
      event.address.toHexString(),
    ]);
  } else {
    tokenURI = tokenURICallResult.value;
  }

  return tokenURI;
}
