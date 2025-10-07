"use client";

import { useEffect, useState } from "react";
import {
  boolCV,
  fetchCallReadOnlyFunction,
  principalCV,
  uintCV,
} from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import type { Pool } from "@/lib/amm";
import {
  AMM_CONTRACT_ADDRESS,
  AMM_CONTRACT_NAME,
} from "@/lib/amm";

export interface SwapQuote {
  outputAmount: bigint;
  feeAmount: bigint;
}

export interface UseSwapQuoteResult {
  quote: SwapQuote | null;
  isLoading: boolean;
  error: string | null;
}

// useSwapQuote calls the read-only `get-swap-quote` helper so users can preview swap results.
// The hook keeps a tiny loading/error state so UIs can react instantly to quote requests.

export function useSwapQuote(
  pool: Pool | null,
  amountIn: number,
  zeroForOne: boolean
): UseSwapQuoteResult {
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchQuote() {
      if (!pool || amountIn <= 0) {
        setQuote(null);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchCallReadOnlyFunction({
          contractAddress: AMM_CONTRACT_ADDRESS,
          contractName: AMM_CONTRACT_NAME,
          functionName: "get-swap-quote",
          functionArgs: [
            principalCV(pool["token-0"]),
            principalCV(pool["token-1"]),
            uintCV(pool.fee),
            uintCV(amountIn),
            boolCV(zeroForOne),
          ],
          network: STACKS_TESTNET,
          senderAddress: AMM_CONTRACT_ADDRESS,
        });

        if (cancelled) return;

        if (result.type !== "ok" || result.value.type !== "tuple") {
          throw new Error("Could not retrieve swap quote");
        }

        const tuple = result.value.value;
        const output = tuple["output-amount"];
        const fee = tuple["fee-amount"];

        if (output.type !== "uint" || fee.type !== "uint") {
          throw new Error("Unexpected quote return shape");
        }

        setQuote({
          outputAmount: BigInt(output.value.toString()),
          feeAmount: BigInt(fee.value.toString()),
        });
      } catch (err) {
        if (cancelled) return;
        setQuote(null);
        setError((err as Error).message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchQuote();

    return () => {
      cancelled = true;
    };
  }, [pool, amountIn, zeroForOne]);

  return { quote, isLoading, error };
}
