using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.TimeEntries
{
    public class ClockInCommand : IRequest<int>
    {
        public int StaffId { get; set; }
        public string PinCode { get; set; } = string.Empty;

        public ClockInCommand(int staffId, string pinCode)
        {
            StaffId = staffId;
            PinCode = pinCode;
        }
    }

    public class ClockInHandler : IRequestHandler<ClockInCommand, int>
    {
        private readonly PosDbContext _context;

        public ClockInHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<int> Handle(ClockInCommand request, CancellationToken cancellationToken)
        {
            // Verify staff exists and PIN matches
            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.Id == request.StaffId && s.PINCode == request.PinCode, cancellationToken);
                
            if (staff == null)
            {
                throw new Exception("Invalid Staff ID or PIN Code");
            }

            // Check if already clocked in
            var activeEntry = await _context.TimeEntries
                .Where(t => t.StaffId == request.StaffId && t.ClockOut == null)
                .FirstOrDefaultAsync(cancellationToken);

            if (activeEntry != null)
            {
                throw new Exception("Staff is already clocked in");
            }

            var entry = new TimeEntry
            {
                StaffId = request.StaffId,
                ClockIn = DateTime.UtcNow,
                IsApproved = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.TimeEntries.Add(entry);
            await _context.SaveChangesAsync(cancellationToken);

            return entry.Id;
        }
    }
}
