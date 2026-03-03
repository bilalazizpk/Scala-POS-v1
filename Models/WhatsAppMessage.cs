using System;

namespace ScalaPOS.Models
{
    public class WhatsAppMessage
    {
        public int Id { get; set; }
        
        /// <summary>External ID from Meta for tracking delivery status</summary>
        public string MetaMessageId { get; set; }
        
        /// <summary>The phone number of the customer</summary>
        public string CustomerPhone { get; set; }
        
        /// <summary>Name of the customer (extracted from webhook profile)</summary>
        public string CustomerName { get; set; }
        
        /// <summary>inbound | outbound</summary>
        public string Direction { get; set; }
        
        public string Body { get; set; }
        
        /// <summary>sent, delivered, read, failed, received</summary>
        public string Status { get; set; }
        
        public DateTime Timestamp { get; set; }
        
        /// <summary>If message contains image/audio</summary>
        public string MediaUrl { get; set; }
    }
}
