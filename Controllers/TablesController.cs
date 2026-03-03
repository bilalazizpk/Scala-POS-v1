using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using Microsoft.AspNetCore.SignalR;
using ScalaPOS.Hubs;

namespace ScalaPOS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TablesController : ControllerBase
    {
        private readonly PosDbContext _context;
        private readonly IHubContext<PosHub> _hubContext;

        public TablesController(PosDbContext context, IHubContext<PosHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/tables
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RestaurantTable>>> GetTables()
        {
            return Ok(await _context.Tables
                .Where(t => t.IsActive)
                .OrderBy(t => t.Section)
                .ThenBy(t => t.Name)
                .ToListAsync());
        }

        // GET: api/tables/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RestaurantTable>> GetTable(int id)
        {
            var table = await _context.Tables.FindAsync(id);
            if (table == null) return NotFound();
            return Ok(table);
        }

        // POST: api/tables
        [HttpPost]
        public async Task<ActionResult<RestaurantTable>> CreateTable([FromBody] RestaurantTable table)
        {
            table.CreatedAt = DateTime.UtcNow;
            table.IsActive = true;
            table.Status = "available";
            _context.Tables.Add(table);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTable), new { id = table.Id }, table);
        }

        // PUT: api/tables/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTable(int id, [FromBody] RestaurantTable table)
        {
            if (id != table.Id) return BadRequest();
            var existing = await _context.Tables.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = table.Name;
            existing.Capacity = table.Capacity;
            existing.Shape = table.Shape;
            existing.Section = table.Section;
            existing.PositionX = table.PositionX;
            existing.PositionY = table.PositionY;
            existing.IsActive = table.IsActive;

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("TableUpdated", existing);

            return Ok(existing);
        }

        // PATCH: api/tables/5/status — update live status (seat, clear, reserve)
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] TableStatusUpdate update)
        {
            var table = await _context.Tables.FindAsync(id);
            if (table == null) return NotFound();

            table.Status = update.Status;
            table.GuestCount = update.GuestCount;
            table.ServerId = update.ServerId;
            table.CurrentOrderId = update.CurrentOrderId;
            table.Notes = update.Notes;

            if (update.Status == "occupied" && table.SeatedAt == null)
                table.SeatedAt = DateTime.UtcNow;
            else if (update.Status == "available")
                table.SeatedAt = null;

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("TableUpdated", table);

            return Ok(table);
        }

        // DELETE: api/tables/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTable(int id)
        {
            var table = await _context.Tables.FindAsync(id);
            if (table == null) return NotFound();
            table.IsActive = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class TableStatusUpdate
    {
        public string Status { get; set; }
        public int? GuestCount { get; set; }
        public int? ServerId { get; set; }
        public int? CurrentOrderId { get; set; }
        public string Notes { get; set; }
    }
}
