using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Shifts
{
    public record UpdateShiftCommand(
        int Id,
        int StaffId,
        DateTime StartTime,
        DateTime EndTime,
        string Role,
        string Notes,
        string Color) : IRequest<bool>;

    public class UpdateShiftValidator : AbstractValidator<UpdateShiftCommand>
    {
        public UpdateShiftValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
            RuleFor(x => x.StaffId).GreaterThan(0);
            RuleFor(x => x.StartTime).NotEmpty();
            RuleFor(x => x.EndTime).GreaterThan(x => x.StartTime).WithMessage("End time must be after start time.");
        }
    }

    public class UpdateShiftHandler : IRequestHandler<UpdateShiftCommand, bool>
    {
        private readonly PosDbContext _context;

        public UpdateShiftHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateShiftCommand request, CancellationToken cancellationToken)
        {
            var shift = await _context.Shifts.FindAsync(new object[] { request.Id }, cancellationToken);
            if (shift == null) return false;

            shift.StaffId = request.StaffId;
            shift.StartTime = request.StartTime;
            shift.EndTime = request.EndTime;
            shift.Role = request.Role;
            shift.Notes = request.Notes;
            if (!string.IsNullOrEmpty(request.Color))
            {
                shift.Color = request.Color;
            }
            shift.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
