import { Address } from '../types/Aliases'
import { RelayRequest } from './RelayRequest'

import { bufferToHex, PrefixedHexString } from 'ethereumjs-util'
import { TypedDataUtils, TypedMessage } from 'eth-sig-util'

export interface MessageTypeProperty {
  name: string
  type: string
}

export interface MessageTypes {
  EIP712Domain: MessageTypeProperty[]

  [additionalProperties: string]: MessageTypeProperty[]
}

export interface EIP712Domain {
  name?: string
  version?: string
  chainId?: number
  verifyingContract?: string
}

export const EIP712DomainType: MessageTypeProperty[] = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

export const EIP712DomainTypeWithoutVersion: MessageTypeProperty[] = [
  { name: 'name', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

const RelayDataType = [
  { name: 'maxFeePerGas', type: 'uint256' },
  { name: 'maxPriorityFeePerGas', type: 'uint256' },
  { name: 'pctRelayFee', type: 'uint256' },
  { name: 'baseRelayFee', type: 'uint256' },
  { name: 'relayWorker', type: 'address' },
  { name: 'paymaster', type: 'address' },
  { name: 'forwarder', type: 'address' },
  { name: 'paymasterData', type: 'bytes' },
  { name: 'clientId', type: 'uint256' }
]

const ForwardRequestType = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'gas', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'data', type: 'bytes' },
  { name: 'validUntilTime', type: 'uint256' }
]

const RelayRequestType = [
  ...ForwardRequestType,
  { name: 'relayData', type: 'RelayData' }
]

interface Types extends MessageTypes {
  EIP712Domain: MessageTypeProperty[]
  RelayRequest: MessageTypeProperty[]
  RelayData: MessageTypeProperty[]
}

// use these values in registerDomainSeparator
export const GsnDomainSeparatorType = {
  prefix: 'string name,string version',
  name: 'GSN Relayed Transaction',
  version: '2'
}

export function getDomainSeparator (verifier: Address, chainId: number): Record<string, unknown> {
  return {
    name: GsnDomainSeparatorType.name,
    version: GsnDomainSeparatorType.version,
    chainId: chainId,
    verifyingContract: verifier
  }
}

export function getDomainSeparatorHash (verifier: Address, chainId: number): PrefixedHexString {
  return bufferToHex(TypedDataUtils.hashStruct('EIP712Domain', getDomainSeparator(verifier, chainId), { EIP712Domain: EIP712DomainType }))
}

export class TypedRequestData implements TypedMessage<Types> {
  readonly types: Types
  readonly domain: EIP712Domain
  readonly primaryType: string
  readonly message: any

  constructor (
    chainId: number,
    verifier: Address,
    relayRequest: RelayRequest) {
    this.types = {
      EIP712Domain: EIP712DomainType,
      RelayRequest: RelayRequestType,
      RelayData: RelayDataType
    }
    this.domain = getDomainSeparator(verifier, chainId)
    this.primaryType = 'RelayRequest'
    // in the signature, all "request" fields are flattened out at the top structure.
    // other params are inside "relayData" sub-type
    this.message = {
      ...relayRequest.request,
      relayData: relayRequest.relayData
    }
  }
}

export const GsnRequestType = {
  typeName: 'RelayRequest',
  typeSuffix: 'RelayData relayData)RelayData(uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,uint256 pctRelayFee,uint256 baseRelayFee,address relayWorker,address paymaster,address forwarder,bytes paymasterData,uint256 clientId)'
}
