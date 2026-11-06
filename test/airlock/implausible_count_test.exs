defmodule OpenPlaatoKeg.ImplausibleCountTest do
  use ExUnit.Case, async: true
  alias OpenPlaatoKeg.KegDataProcessor, as: P

  defp state(prev, mins_ago),
    do: %{airlock_last_count: prev, airlock_last_count_time: System.system_time(:millisecond) - round(mins_ago * 60_000)}

  test "a 430k jump in 3 minutes is a glitch" do
    assert P.implausible_count?("430100", state(100, 3.3))
  end

  test "normal fermentation counts pass" do
    refute P.implausible_count?("148", state(100, 5))
    refute P.implausible_count?("12", state(100, 5))
    refute P.implausible_count?("500", %{})
  end
end
