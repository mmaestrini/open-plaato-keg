defmodule OpenPlaatoKeg.KegPercentTest do
  use ExUnit.Case, async: true
  alias OpenPlaatoKeg.Models.KegData

  test "percent comes from amount_left / max_keg_volume, not the stale V48 pin" do
    data = %{amount_left: "2.750", max_keg_volume: "5.500", percent_of_beer_left: "30.000"}
    assert KegData.with_percent(data).percent_of_beer_left == "50.0"
  end

  test "clamps to 0..100" do
    assert KegData.with_percent(%{amount_left: "6.08", max_keg_volume: "5.5"}).percent_of_beer_left == "100.0"
    assert KegData.with_percent(%{amount_left: "-0.07", max_keg_volume: "5.5"}).percent_of_beer_left == "0.0"
  end

  test "leaves data alone without a usable max" do
    data = %{amount_left: "6.0", percent_of_beer_left: "30.000"}
    assert KegData.with_percent(data) == data
    assert KegData.with_percent(%{amount_left: "6.0", max_keg_volume: "0"})[:percent_of_beer_left] == nil
  end
end
