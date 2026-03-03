using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Shifts
{
    public record GetShiftsQuery(DateTime StartDate, DateTime EndDate) : IRequest<List<ShiftDto>>;

    public class ShiftDto
    {
        public int Id { get; set; }
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }

    public class GetShiftsHandler : IRequestHandler<GetShiftsQuery, List<ShiftDto>>
    {
        private readonly PosDbContext _context;

        public GetShiftsHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<List<ShiftDto>> Handle(GetShiftsQuery request, CancellationToken cancellationToken)
        {
            var shifts = await _context.Shifts
                .Include(s => s.Staff)
                .Where(s => s.StartTime >= request.StartDate && s.StartTime <= request.EndDate)
                .Select(s => new ShiftDto
                {
                    Id = s.Id,
                    StaffId = s.StaffId,
                    StaffName = s.Staff != null ? $"{s.Staff.FirstName} {s.Staff.LastName}" : "Unknown",
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    Role = s.Role,
                    Notes = s.Notes,
                    Color = s.Color
                })
                .ToListAsync(cancellationToken);

            return shifts;
        }
    }
}
