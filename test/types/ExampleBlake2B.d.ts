/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface ExampleBlake2BInterface extends ethers.utils.Interface {
  functions: {
    "F(uint32,bytes32[2],bytes32[4],bytes8[2],bool)": FunctionFragment;
    "callF()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "F",
    values: [
      BigNumberish,
      [BytesLike, BytesLike],
      [BytesLike, BytesLike, BytesLike, BytesLike],
      [BytesLike, BytesLike],
      boolean
    ]
  ): string;
  encodeFunctionData(functionFragment: "callF", values?: undefined): string;

  decodeFunctionResult(functionFragment: "F", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "callF", data: BytesLike): Result;

  events: {};
}

export class ExampleBlake2B extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: ExampleBlake2BInterface;

  functions: {
    F(
      rounds: BigNumberish,
      h: [BytesLike, BytesLike],
      m: [BytesLike, BytesLike, BytesLike, BytesLike],
      t: [BytesLike, BytesLike],
      f: boolean,
      overrides?: CallOverrides
    ): Promise<[[string, string]]>;

    "F(uint32,bytes32[2],bytes32[4],bytes8[2],bool)"(
      rounds: BigNumberish,
      h: [BytesLike, BytesLike],
      m: [BytesLike, BytesLike, BytesLike, BytesLike],
      t: [BytesLike, BytesLike],
      f: boolean,
      overrides?: CallOverrides
    ): Promise<[[string, string]]>;

    callF(overrides?: CallOverrides): Promise<[[string, string]]>;

    "callF()"(overrides?: CallOverrides): Promise<[[string, string]]>;
  };

  F(
    rounds: BigNumberish,
    h: [BytesLike, BytesLike],
    m: [BytesLike, BytesLike, BytesLike, BytesLike],
    t: [BytesLike, BytesLike],
    f: boolean,
    overrides?: CallOverrides
  ): Promise<[string, string]>;

  "F(uint32,bytes32[2],bytes32[4],bytes8[2],bool)"(
    rounds: BigNumberish,
    h: [BytesLike, BytesLike],
    m: [BytesLike, BytesLike, BytesLike, BytesLike],
    t: [BytesLike, BytesLike],
    f: boolean,
    overrides?: CallOverrides
  ): Promise<[string, string]>;

  callF(overrides?: CallOverrides): Promise<[string, string]>;

  "callF()"(overrides?: CallOverrides): Promise<[string, string]>;

  callStatic: {
    F(
      rounds: BigNumberish,
      h: [BytesLike, BytesLike],
      m: [BytesLike, BytesLike, BytesLike, BytesLike],
      t: [BytesLike, BytesLike],
      f: boolean,
      overrides?: CallOverrides
    ): Promise<[string, string]>;

    "F(uint32,bytes32[2],bytes32[4],bytes8[2],bool)"(
      rounds: BigNumberish,
      h: [BytesLike, BytesLike],
      m: [BytesLike, BytesLike, BytesLike, BytesLike],
      t: [BytesLike, BytesLike],
      f: boolean,
      overrides?: CallOverrides
    ): Promise<[string, string]>;

    callF(overrides?: CallOverrides): Promise<[string, string]>;

    "callF()"(overrides?: CallOverrides): Promise<[string, string]>;
  };

  filters: {};

  estimateGas: {
    F(
      rounds: BigNumberish,
      h: [BytesLike, BytesLike],
      m: [BytesLike, BytesLike, BytesLike, BytesLike],
      t: [BytesLike, BytesLike],
      f: boolean,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "F(uint32,bytes32[2],bytes32[4],bytes8[2],bool)"(
      rounds: BigNumberish,
      h: [BytesLike, BytesLike],
      m: [BytesLike, BytesLike, BytesLike, BytesLike],
      t: [BytesLike, BytesLike],
      f: boolean,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    callF(overrides?: CallOverrides): Promise<BigNumber>;

    "callF()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    F(
      rounds: BigNumberish,
      h: [BytesLike, BytesLike],
      m: [BytesLike, BytesLike, BytesLike, BytesLike],
      t: [BytesLike, BytesLike],
      f: boolean,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "F(uint32,bytes32[2],bytes32[4],bytes8[2],bool)"(
      rounds: BigNumberish,
      h: [BytesLike, BytesLike],
      m: [BytesLike, BytesLike, BytesLike, BytesLike],
      t: [BytesLike, BytesLike],
      f: boolean,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    callF(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "callF()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
