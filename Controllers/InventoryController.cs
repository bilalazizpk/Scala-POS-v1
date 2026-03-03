using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ScalaPOS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly PosDbContext _context;

        public InventoryController(PosDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<InventoryItem>>> GetInventory()
        {
            return await _context.InventoryItems
                .Include(i => i.Product)
                .OrderBy(i => i.Product.Name)
                .ToListAsync();
        }

        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<InventoryItem>>> GetLowStock()
        {
            return await _context.InventoryItems
                .Include(i => i.Product)
                .Where(i => i.CurrentStock <= i.ReorderLevel)
                .OrderBy(i => i.CurrentStock)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryItem>> GetInventoryItem(int id)
        {
            var item = await _context.InventoryItems
                .Include(i => i.Product)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (item == null)
                return NotFound();

            return item;
        }

        [HttpPost]
        public async Task<ActionResult<InventoryItem>> CreateInventoryItem(InventoryItem item)
        {
            item.CreatedAt = System.DateTime.Now;
            item.LastRestocked = System.DateTime.Now;

            _context.InventoryItems.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInventoryItem), new { id = item.Id }, item);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInventoryItem(int id, InventoryItem item)
        {
            if (id != item.Id)
                return BadRequest();

            item.UpdatedAt = System.DateTime.Now;
            _context.Entry(item).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await InventoryItemExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpPost("{id}/restock")]
        public async Task<IActionResult> RestockItem(int id, [FromBody] int quantity)
        {
            var item = await _context.InventoryItems.FindAsync(id);
            if (item == null)
                return NotFound();

            item.CurrentStock += quantity;
            item.LastRestocked = System.DateTime.Now;
            item.UpdatedAt = System.DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { currentStock = item.CurrentStock });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventoryItem(int id)
        {
            var item = await _context.InventoryItems.FindAsync(id);
            if (item == null)
                return NotFound();

            _context.InventoryItems.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> InventoryItemExists(int id)
        {
            return await _context.InventoryItems.AnyAsync(e => e.Id == id);
        }
    }
}
