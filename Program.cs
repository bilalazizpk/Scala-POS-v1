using System;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ScalaPOS.Data;
using FluentValidation;
using MediatR;
using ScalaPOS.Infrastructure.Behaviors;
using ScalaPOS.Endpoints;
using ScalaPOS.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddDbContext<PosDbContext>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR WebSockets
    });
});

builder.Services.AddSignalR();

// CQRS + Validation setup
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Program>());
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<ScalaPOS.Services.AuditService>();

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");
app.UseAuthorization();
app.MapControllers();

// Register Minimal APIs & SignalR
app.MapOrderEndpoints();
app.MapShiftEndpoints();
app.MapTimeEntryEndpoints();
app.MapKitchenEndpoints();
app.MapAccountingEndpoints();
app.MapTableEndpoints();
app.MapAppointmentEndpoints();
app.MapAuditEndpoints();
app.MapHelpdeskEndpoints();
app.MapSupplyChainEndpoints();
app.MapPurchaseOrderEndpoints();
app.MapProjectEndpoints();
app.MapDocumentEndpoints();
app.MapAnalyticsEndpoints();
app.MapSyncEndpoints();
app.MapWhatsAppEndpoints();
app.MapInventoryEndpoints();
app.MapAIEndpoints();
app.MapReservationEndpoints();
app.MapWaitlistEndpoints();
app.MapHub<PosHub>("/hubs/pos");
app.MapHub<KitchenHub>("/hubs/kitchen");
// Ensure database is created with all seed data (HasData in OnModelCreating)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<PosDbContext>();
    try 
    {
        context.Database.EnsureCreated();
        Console.WriteLine("[DB] Database ready.");
    }
    catch (Exception ex)
    {
        System.IO.File.WriteAllText("error.txt", ex.ToString());
    }
}



app.Run();
