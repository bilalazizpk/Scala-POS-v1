using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.TimeEntries
{
    public class ClockOutCommand : IRequest<bool>
    {
        public int StaffId { get; set; }
        public string Notes { get; set; } = string.Empty;

        public ClockOutCommand(int staffId, string notes)
        {
            StaffId = staffId;
            Notes = notes;
        }
    }

    public class ClockOutHandler : IRequestHandler<ClockOutCommand, bool>
    {
        private readonly PosDbContext _context;

        public ClockOutHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(ClockOutCommand request, CancellationToken cancellationToken)
        {
            // Find the most recent active clock-in for this staff member
            var activeEntry = await _context.TimeEntries
                .Where(t => t.StaffId == request.StaffId && t.ClockOut == null)
                .OrderByDescending(t => t.ClockIn)
                .FirstOrDefaultAsync(cancellationToken);

            if (activeEntry == null)
            {
                return false; // Not clocked in
            }

            activeEntry.ClockOut = DateTime.UtcNow;
            activeEntry.UpdatedAt = DateTime.UtcNow;
            
            if (!string.IsNullOrEmpty(request.Notes))
            {
                activeEntry.Notes = string.IsNullOrEmpty(activeEntry.Notes) 
                    ? request.Notes 
                    : $"{activeEntry.Notes}\nClock-out note: {request.Notes}";
            }

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
