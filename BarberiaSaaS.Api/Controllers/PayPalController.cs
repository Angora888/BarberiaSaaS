using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/paypal")]
[Authorize]
public sealed class PayPalController : ControllerBase
{
    private readonly IPayPalService _payPalService;

    public PayPalController(IPayPalService payPalService)
    {
        _payPalService = payPalService;
    }

    [HttpGet("subscription-config")]
    public IActionResult GetSubscriptionConfig()
    {
        try
        {
            var config = _payPalService.GetClientConfig();
            return Ok(new { config.ClientId, config.PlanId, config.Mode, price = "10.00", currency = "USD" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("subscriptions/{subscriptionId}")]
    public async Task<IActionResult> GetSubscription(string subscriptionId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _payPalService.GetSubscriptionAsync(subscriptionId, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
