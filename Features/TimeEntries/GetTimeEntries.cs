using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.TimeEntries
{
    public class GetTimeEntriesQuery : IRequest<List<TimeEntryDto>>
    {
        public int? StaffId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public GetTimeEntriesQuery(int? staffId, DateTime? startDate, DateTime? endDate)
        {
            StaffId = staffId;
            StartDate = startDate;
            EndDate = endDate;
        }
    }

    public class TimeEntryDto
    {
        public int Id { get; set; }
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        public int? BreakMinutes { get; set; }
        public bool IsApproved { get; set; }
        public string Notes { get; set; } = string.Empty;
        public double? TotalHours { get; set; }
    }

    public class GetTimeEntriesHandler : IRequestHandler<GetTimeEntriesQuery, List<TimeEntryDto>>
    {
        private readonly PosDbContext _context;

        public GetTimeEntriesHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<List<TimeEntryDto>> Handle(GetTimeEntriesQuery request, CancellationToken cancellationToken)
        {
            var query = _context.TimeEntries
                .Include(t => t.Staff)
                .AsQueryable();

            if (request.StaffId.HasValue)
            {
                query = query.Where(t => t.StaffId == request.StaffId.Value);
            }

            if (request.StartDate.HasValue)
            {
                query = query.Where(t => t.ClockIn >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue)
            {
                var end = request.EndDate.Value.AddDays(1);
                query = query.Where(t => t.ClockIn < end);
            }

            var entries = await query
                .OrderByDescending(t => t.ClockIn)
                .ToListAsync(cancellationToken);

            return entries.Select(t => new TimeEntryDto
            {
                Id = t.Id,
                StaffId = t.StaffId,
                StaffName = t.Staff != null ? $"{t.Staff.FirstName} {t.Staff.LastName}" : "Unknown",
                Role = t.Staff?.Role ?? "Unknown",
                ClockIn = t.ClockIn,
                ClockOut = t.ClockOut,
                BreakMinutes = t.BreakMinutes,
                IsApproved = t.IsApproved,
                Notes = t.Notes,
                TotalHours = t.ClockOut.HasValue 
                    ? (t.ClockOut.Value - t.ClockIn).TotalHours - (t.BreakMinutes ?? 0) / 60.0
                    : null
            }).ToList();
        }
    }
}
