defmodule OpenPlaatoKeg.KegEventsTest do
  use ExUnit.Case
  alias OpenPlaatoKeg.Models.DataLog

  setup do
    file = Path.join(System.tmp_dir!(), "events_test_#{System.unique_integer([:positive])}.bin")
    {:ok, _} = :dets.open_file(:data_log, file: String.to_charlist(file))
    on_exit(fn -> :dets.close(:data_log); File.rm(file) end)
  end

  test "events come back newest first, only for that keg" do
    DataLog.event("k1", "disconnected", "closed by keg after 5s")
    Process.sleep(2)
    DataLog.event("k1", "connected", "")
    DataLog.event("k2", "connected", "")

    assert [%{"type" => "connected"}, %{"type" => "disconnected", "detail" => "closed by keg after 5s"}] =
             DataLog.events("k1", 0)
  end
end
