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
    public class CustomersController : ControllerBase
    {
        private readonly PosDbContext _context;

        public CustomersController(PosDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
        {
            return await _context.Customers
                .Where(c => c.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetCustomer(int id)
        {
            var customer = await _context.Customers
                .Include(c => c.Orders)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
                return NotFound();

            return customer;
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Customer>>> SearchCustomers([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return await GetCustomers();

            return await _context.Customers
                .Where(c => c.IsActive && 
                    (c.FirstName.Contains(query) || 
                     c.LastName.Contains(query) || 
                     c.Email.Contains(query) || 
                     c.Phone.Contains(query)))
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Customer>> CreateCustomer(Customer customer)
        {
            customer.CreatedAt = System.DateTime.Now;
            customer.MemberSince = System.DateTime.Now;
            customer.IsActive = true;
            customer.LoyaltyPoints = 0;
            customer.TotalSpent = 0;
            customer.VisitCount = 0;
            customer.MembershipTier = "Bronze";

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, Customer customer)
        {
            if (id != customer.Id)
                return BadRequest();

            customer.UpdatedAt = System.DateTime.Now;
            _context.Entry(customer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await CustomerExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpPost("{id}/add-points")]
        public async Task<IActionResult> AddLoyaltyPoints(int id, [FromBody] int points)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
                return NotFound();

            customer.LoyaltyPoints += points;
            customer.UpdatedAt = System.DateTime.Now;

            // Update tier based on total spent
            if (customer.TotalSpent >= 5000) customer.MembershipTier = "Platinum";
            else if (customer.TotalSpent >= 2500) customer.MembershipTier = "Gold";
            else if (customer.TotalSpent >= 1000) customer.MembershipTier = "Silver";
            else customer.MembershipTier = "Bronze";

            await _context.SaveChangesAsync();

            return Ok(new { loyaltyPoints = customer.LoyaltyPoints, tier = customer.MembershipTier });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
                return NotFound();

            // Soft delete
            customer.IsActive = false;
            customer.UpdatedAt = System.DateTime.Now;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> CustomerExists(int id)
        {
            return await _context.Customers.AnyAsync(e => e.Id == id);
        }
    }
}
