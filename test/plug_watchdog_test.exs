defmodule OpenPlaatoKeg.PlugWatchdogTest do
  use ExUnit.Case, async: true
  alias OpenPlaatoKeg.PlugWatchdog, as: W

  @now 1_800_000_000_000
  defp ago(min), do: to_string(@now - min * 60_000)

  test "cycles a keg silent for over 15 min" do
    assert W.due?(%{my_plug_ip: "192.168.1.60", last_seen: ago(16)}, @now)
  end

  test "leaves alive kegs, kegs without plug, and recent cycles alone" do
    refute W.due?(%{my_plug_ip: "192.168.1.60", last_seen: ago(2)}, @now)
    refute W.due?(%{last_seen: ago(60)}, @now)
    refute W.due?(%{my_plug_ip: "", last_seen: ago(60)}, @now)
    refute W.due?(%{my_plug_ip: "192.168.1.60", last_seen: ago(60), my_plug_cycled_at: ago(10)}, @now)
    assert W.due?(%{my_plug_ip: "192.168.1.60", last_seen: ago(60), my_plug_cycled_at: ago(31)}, @now)
  end
end
