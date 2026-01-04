<?php
// WhatsApp Notification for Contact Form
// Host this file for free on 000webhostapp.com or any PHP hosting

$whatsappNumber = "254731570131";
$apiKey = "YOUR_CALLMEBOT_API_KEY"; // Get free key from https://www.callmebot.com/

// Get form data
$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$phone = $_POST['phone'] ?? '';
$company = $_POST['company'] ?? '';
$service = $_POST['service'] ?? '';
$message = $_POST['message'] ?? '';

// Format service
$services = [
    'security-assessment' => 'Security Assessment',
    'vulnerability-scanning' => 'Vulnerability Scanning', 
    'incident-response' => 'Incident Response',
    'digital-forensics' => 'Digital Forensics',
    'it-solutions' => 'IT Solutions',
    'training-awareness' => 'Training & Awareness'
];
$serviceName = $services[$service] ?? $service ?? 'General Inquiry';

// Build message
$text = "*NEW INQUIRY*%0A%0A";
$text .= "Name: $name%0A";
$text .= "Email: $email%0A";
if($phone) $text .= "Phone: $phone%0A";
if($company) $text .= "Company: $company%0A";
$text .= "Service: $serviceName%0A%0A";
$text .= "Message:%0A$message";

// Send WhatsApp via CallMeBot
$url = "https://api.callmebot.com/whatsapp.php?phone=$whatsappNumber&text=$text&apikey=$apiKey";
file_get_contents($url);

// Send email
mail("traceveilforensics@gmail.com", "New Website Inquiry: $name", $text);

echo "OK";
?>
