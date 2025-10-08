## Swap Quote Preview Feature

I added a read-only `get-swap-quote` helper to the AMM contract and a `useSwapQuote` hook on the frontend. Together they let the UI ask the pool for an exact output + fee preview before a swap runs.

### Why it matters
- Traders see what they will receive and the fee that gets shaved off.
- No transactions are broadcast just to check pricing.
- It keeps the math consistent because the contract reuses the same x*y=k logic as the live swap.

### Where to look
- Contract function: `contracts/amm.clar` → `get-swap-quote`
- Frontend hook: `frontend/hooks/use-swap-quote.ts`
- Safety net: `tests/amm.test.ts` → “returns swap quotes that match actual swap output”

### Quick demo idea
Type an amount into the swap form, watch the hook surface the preview, then execute the swap and see the on-chain result match the quote.
