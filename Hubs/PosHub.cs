using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace ScalaPOS.Hubs
{
    public class PosHub : Hub
    {
        // For Phase 1 MVP, we will simply allow clients to connect.
        // In the future, this is where we'd add Groups.AddToGroupAsync for specific Store IDs.
        
        public async Task JoinStore(int storeId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"store:{storeId}");
        }

        public async Task JoinKdsStation(int stationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"kds:{stationId}");
        }

        public async Task JoinTableRoom(string section)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "tables");
        }
    }
}
