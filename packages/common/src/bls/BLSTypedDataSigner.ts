import { BigNumber } from 'ethers'
import { toBN } from 'web3-utils'
import { PrefixedHexString } from 'ethereumjs-util'

import {
  aggreagate,
  g1ToBN,
  g1ToHex,
  g2ToBN,
  init,
  MAPPING_MODE_TI, mclToHex,
  newFp,
  newG1,
  newKeyPair,
  setDomain,
  setMappingMode,
  sign
} from './evmbls/mcl'

export interface BLSKeypair {
  secret: any
  pubkey: any
}

const BigNumberToBN = (it: BigNumber): BN => toBN(it.toString())

/**
 * The ERC-712 describes the specification of structured data signature, but relies on the ECDSA
 * signing algorithm traditional for Ethereum.
 *
 * Here we implement a similar signature scheme that uses a BLS signatures that rely on precompiles
 * added to the Ethereum protocol since EIP-197.
 *
 */
export class BLSTypedDataSigner {
  readonly blsKeypair: BLSKeypair

  static async newKeypair (): Promise<BLSKeypair> {
    await this.init()
    return newKeyPair()
  }

  static aggregateSignatures (signatures: PrefixedHexString[][]): BN[] {
    let aggSignature = newG1()
    for (const signature of signatures) {
      const signatureG1 = BLSTypedDataSigner._hex_to_mcl_G1_type(signature)
      aggSignature = aggreagate(aggSignature, signatureG1)
      console.log('A')
      BLSTypedDataSigner.g1SignatureToBN(signatureG1) // REMOVE: logging only
      BLSTypedDataSigner.g1SignatureToBN(aggSignature) // REMOVE: logging only
      console.log('B')
    }
    return BLSTypedDataSigner.g1SignatureToBN(aggSignature)
  }

  private static _hex_to_mcl_G1_type (hex: PrefixedHexString[]): any {
    if (hex[0].length !== 64 || hex[1].length !== 64) {
      console.error('_hex_to_mcl_G1_type: Incorrect hex signature string length!')
    }
    // TODO: verify this is the right thing to do
    const hexX = hex[0].padStart(64, '0')
    const hexY = hex[1].padStart(64, '0')
    const hexZ = hex[2].padStart(64, '0')
    const bufferX = Buffer.from(hexX, 'hex').reverse()
    const bufferY = Buffer.from(hexY, 'hex').reverse()
    const bufferZ = Buffer.from(hexZ, 'hex').reverse()
    const x = newFp()
    const y = newFp()
    const z = newFp()
    const p = newG1()
    x.deserialize(bufferX)
    y.deserialize(bufferY)
    z.deserialize(bufferZ)
    p.setX(x)
    p.setY(y)
    p.setZ(z)

    console.log(`_hex_to_mcl_G1_type input: ${JSON.stringify(hex)} output: ${JSON.stringify(g1ToHex(p))}`)

    return p
  }

  private static async init (): Promise<void> {
    await init()
    setMappingMode(MAPPING_MODE_TI)
    setDomain('testing-evmbls')
  }

  constructor (_: { keypair: BLSKeypair }) {
    this.blsKeypair = _.keypair
  }

  getPublicKeySerialized (): BN[] {
    return g2ToBN(this.blsKeypair.pubkey).map(BigNumberToBN)
  }

  async signTypedDataBLS (message: PrefixedHexString): Promise<BN[]> {
    const {
      signature,
      M
    } = sign(message, this.blsKeypair.secret)
    const messageHashStr = JSON.stringify(g1ToBN(M))
    console.log('signTypedDataBLS: message hashToPoint: ', messageHashStr)
    return BLSTypedDataSigner.g1SignatureToBN(signature)
  }

  private static g1SignatureToBN (signature: any): BN[] {
    const signatureBN = g1ToBN(signature).map(BigNumberToBN)
    const signatureZasBN = toBN(mclToHex(signature.getZ()))
    signatureBN.push(signatureZasBN)
    const hexX = signatureBN[0].toString('hex')
    const hexY = signatureBN[1].toString('hex')
    const hexZ = signatureBN[2].toString('hex')
    console.log('g1SignatureToBN: signature: ', hexX, hexX.length, hexY, hexY.length, hexZ, hexZ.length)
    return signatureBN
  }
}
