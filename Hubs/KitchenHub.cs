using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace ScalaPOS.Hubs
{
    public class KitchenHub : Hub
    {
        public async Task JoinStation(string stationName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"kds_{stationName.ToLower()}");
        }

        public async Task LeaveStation(string stationName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"kds_{stationName.ToLower()}");
        }
    }
}
