defmodule OpenPlaatoKeg.PlugWatchdog do
  @moduledoc """
  Power-cycles a keg through its Shelly smart plug when the keg has gone silent.

  The keg firmware does not notice a TCP connection that died while Wi-Fi stayed
  up, so it never reconnects on its own. Every minute this checks each keg with
  a plug IP (`my_plug_ip`); if `last_seen` is older than @silent_ms and the plug
  was not cycled in the last @cooldown_ms, it switches the plug off and lets the
  plug itself switch back on after 10 s (Shelly `toggle_after`), so a server
  crash mid-cycle can never leave a keg unpowered.
  """
  use GenServer
  require Logger
  alias OpenPlaatoKeg.Models.KegData

  @tick_ms 60_000
  @silent_ms 15 * 60_000
  @cooldown_ms 30 * 60_000

  def start_link(_), do: GenServer.start_link(__MODULE__, nil, name: __MODULE__)

  @impl true
  def init(_) do
    Process.send_after(self(), :tick, @tick_ms)
    # Grace period: after a server restart every keg looks silent until it reconnects.
    {:ok, %{started_at: now()}}
  end

  @impl true
  def handle_info(:tick, state) do
    if now() - state.started_at > @silent_ms do
      KegData.devices() |> Enum.each(&check/1)
    end

    Process.send_after(self(), :tick, @tick_ms)
    {:noreply, state}
  end

  defp check(id) do
    keg = KegData.get(id)
    if due?(keg, now()) do
      mins = div(now() - String.to_integer(keg[:last_seen]), 60_000)
      cycle(id, keg[:my_plug_ip], "automatic: silent for #{mins} min")
    end
  end

  @doc false
  # Public for testing.
  def due?(keg, now) do
    with ip when is_binary(ip) and ip != "" <- keg[:my_plug_ip],
         {seen, _} <- Integer.parse(to_string(keg[:last_seen] || "")) do
      cycled = case Integer.parse(to_string(keg[:my_plug_cycled_at] || "")), do: ({n, _} -> n; _ -> 0)
      now - seen > @silent_ms and now - cycled > @cooldown_ms
    else
      _ -> false
    end
  end

  @doc "Switch the plug off; the plug turns itself back on after 10 s."
  def cycle(id, ip, reason) do
    Logger.warning("Keg #{id}: power-cycling plug #{ip} (#{reason})")
    KegData.publish(id, [{:my_plug_cycled_at, to_string(now())}])

    result =
      case Req.get("http://#{ip}/rpc/Switch.Set",
             params: [id: 0, on: false, toggle_after: 10],
             receive_timeout: 5_000,
             retry: false
           ) do
        {:ok, %{status: 200}} -> :ok
        {:ok, %{status: s, body: b}} -> Logger.error("Plug #{ip}: HTTP #{s} #{inspect(b)}") && {:error, "HTTP #{s}"}
        {:error, e} -> Logger.error("Plug #{ip}: #{Exception.message(e)}") && {:error, Exception.message(e)}
      end

    detail = if result == :ok, do: reason, else: "#{reason}, FAILED: #{elem(result, 1)}"
    OpenPlaatoKeg.Models.DataLog.event(id, "restart", detail)
    result
  end

  defp now, do: System.system_time(:millisecond)
end
