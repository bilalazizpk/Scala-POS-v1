using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;


namespace ScalaPOS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly PosDbContext _context;

        public StaffController(PosDbContext context)
        {
            _context = context;
        }

        // GET: api/staff
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Staff>>> GetStaff()
        {
            return Ok(await _context.Staff
                .Where(s => s.IsActive)
                .OrderBy(s => s.FirstName)
                .ToListAsync());
        }

        // GET: api/staff/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Staff>> GetStaff(int id)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null) return NotFound();
            return Ok(staff);
        }

        // POST: api/staff
        [HttpPost]
        public async Task<ActionResult<Staff>> CreateStaff([FromBody] Staff staff)
        {
            staff.CreatedAt = DateTime.UtcNow;
            staff.IsActive = true;
            _context.Staff.Add(staff);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetStaff), new { id = staff.Id }, staff);
        }

        // PUT: api/staff/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStaff(int id, [FromBody] Staff staff)
        {
            if (id != staff.Id) return BadRequest();

            var existing = await _context.Staff.FindAsync(id);
            if (existing == null) return NotFound();

            existing.FirstName = staff.FirstName;
            existing.LastName = staff.LastName;
            existing.Email = staff.Email;
            existing.Phone = staff.Phone;
            existing.Role = staff.Role;
            existing.PINCode = staff.PINCode;
            existing.HourlyRate = staff.HourlyRate;
            existing.EmployeeId = staff.EmployeeId;
            existing.IsActive = staff.IsActive;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/staff/5 (soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStaff(int id)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null) return NotFound();

            staff.IsActive = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/staff/login
        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] StaffLoginRequest request)
        {
            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.Role == request.Role && s.PINCode == request.Pin && s.IsActive);

            if (staff == null)
                return Unauthorized(new { message = "Invalid role or PIN" });

            return Ok(new
            {
                id = staff.Id,
                firstName = staff.FirstName,
                lastName = staff.LastName,
                email = staff.Email,
                role = staff.Role,
                employeeId = staff.EmployeeId,
            });
        }
    }

    public class StaffLoginRequest
    {
        public string Role { get; set; } = string.Empty;
        public string Pin { get; set; } = string.Empty;
    }
}
