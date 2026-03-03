using FluentValidation;
using MediatR;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Shifts
{
    public record CreateShiftCommand(
        int StaffId, 
        DateTime StartTime, 
        DateTime EndTime, 
        string Role, 
        string Notes, 
        string Color) : IRequest<int>;

    public class CreateShiftValidator : AbstractValidator<CreateShiftCommand>
    {
        public CreateShiftValidator()
        {
            RuleFor(x => x.StaffId).GreaterThan(0);
            RuleFor(x => x.StartTime).NotEmpty();
            RuleFor(x => x.EndTime).GreaterThan(x => x.StartTime).WithMessage("End time must be after start time.");
        }
    }

    public class CreateShiftHandler : IRequestHandler<CreateShiftCommand, int>
    {
        private readonly PosDbContext _context;

        public CreateShiftHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<int> Handle(CreateShiftCommand request, CancellationToken cancellationToken)
        {
            var shift = new Shift
            {
                StaffId = request.StaffId,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Role = request.Role,
                Notes = request.Notes,
                Color = string.IsNullOrEmpty(request.Color) ? "#3b82f6" : request.Color,
                CreatedAt = DateTime.UtcNow
            };

            _context.Shifts.Add(shift);
            await _context.SaveChangesAsync(cancellationToken);

            return shift.Id;
        }
    }
}
