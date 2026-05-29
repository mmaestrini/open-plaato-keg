defmodule OpenPlaatoKeg.Airlock.BubbleTotalAccountingTest do
  @moduledoc """
  Regression tests for the airlock lifetime-total accounting in
  `KegDataProcessor.accumulate_bubble_total/3`.

  Why this is its own file: the original bug was that a manual reset via
  POST /api/airlocks/:id/reset zeroed DETS but did NOT clear the live
  per-connection GenServer's in-memory `total_bubble_count` cache. On the
  next packet within the same TCP wake-up the GenServer recomputed the
  running total against its STALE in-memory base and wrote the old
  aggregate (plus a small delta) right back into DETS — so the reset
  silently undid itself and Per saw the old number "reappear".

  The fix: `accumulate_bubble_total/3` now takes the base total as an
  explicit argument so the caller can supply the freshly-read DETS value
  (the source of truth that the reset endpoint modifies) instead of
  reaching into stale GenServer state. These tests pin that contract.
  """

  use ExUnit.Case, async: true

  alias OpenPlaatoKeg.KegDataProcessor

  describe "accumulate_bubble_total/3 — reset-stickiness (Per's bug)" do
    test "uses the supplied base — not the cached in-memory total — so external resets stick" do
      # GenServer's in-memory state still reflects the pre-reset world
      # (lifetime total 4523, last V100 reading 15). Meanwhile DETS has just
      # been zeroed by the reset endpoint, so the caller supplies 0 as the
      # base. The new total must start counting from that 0, not from 4523.
      stale_state = %{airlock_last_count: 17, total_bubble_count: 4523}

      {new_state, total} =
        KegDataProcessor.accumulate_bubble_total(stale_state, _prev_count = 15, _base_from_dets = 0)

      # delta = 17 - 15 = 2 ⇒ total = 0 + 2, NOT 4523 + 2
      assert total == 2
      assert new_state[:total_bubble_count] == 2
    end
  end

  describe "accumulate_bubble_total/3 — regression cases" do
    test "with no prior count, treats new_count as the delta against base" do
      state = %{airlock_last_count: 10}

      {_, total} = KegDataProcessor.accumulate_bubble_total(state, nil, 100)
      assert total == 110
    end

    test "when V100 wraps on a fresh hardware wake-up (new < prev), uses new_count as delta" do
      # Hardware resets V100 to 0 on each wake-up. Mid-connection seeding has
      # prev=10 (last value of the previous wake-up); the first packet of the
      # current wake-up sends new=2.
      state = %{airlock_last_count: 2}

      {_, total} = KegDataProcessor.accumulate_bubble_total(state, 10, 100)
      assert total == 102
    end

    test "no change when new_count equals prev_count (e.g. V101 temperature-only packet)" do
      state = %{airlock_last_count: 15}

      {new_state, total} = KegDataProcessor.accumulate_bubble_total(state, 15, 42)

      assert total == 42
      assert new_state == state
    end

    test "no change when no new count is present" do
      state = %{}

      {new_state, total} = KegDataProcessor.accumulate_bubble_total(state, 15, 42)

      assert total == 42
      assert new_state == state
    end

    test "treats a nil base_total as zero" do
      state = %{airlock_last_count: 7}

      {_, total} = KegDataProcessor.accumulate_bubble_total(state, 0, nil)
      assert total == 7
    end
  end
end
