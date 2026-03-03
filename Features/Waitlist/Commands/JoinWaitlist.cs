using MediatR;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Waitlist.Commands
{
    public class JoinWaitlistCommand : IRequest<WaitlistEntry>
    {
        public string CustomerName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public int PartySize { get; set; }
        public int QuotedWaitTime { get; set; }
        public string? Notes { get; set; }
    }

    public class JoinWaitlistHandler : IRequestHandler<JoinWaitlistCommand, WaitlistEntry>
    {
        private readonly PosDbContext _context;

        public JoinWaitlistHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<WaitlistEntry> Handle(JoinWaitlistCommand request, CancellationToken cancellationToken)
        {
            var entry = new WaitlistEntry
            {
                CustomerName = request.CustomerName,
                PhoneNumber = request.PhoneNumber,
                PartySize = request.PartySize,
                QuotedWaitTime = request.QuotedWaitTime,
                Notes = request.Notes,
                JoinTime = DateTime.UtcNow,
                Status = "Waiting"
            };

            _context.WaitlistEntries.Add(entry);
            await _context.SaveChangesAsync(cancellationToken);

            return entry;
        }
    }
}
