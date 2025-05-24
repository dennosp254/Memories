<?php
$cloudName = 'dpmqdvjd4' ?? 'dhjkphmcc';
$apiKey = '293864622867266' ?? '566412233268355';
$apiSecret = 'dVpgW-o5cHW6CzGIoYtp6rPJguc' ?? 'yF5YkkgdEGwvpQuI4u_GpyWtHHA';
$folder = 'gallery';

$params = [
    
    'max_results' => 100000,
    'type' => 'upload',
];

$queryString = http_build_query($params);

$apiUrl = "https://api.cloudinary.com/v1_1/$cloudName/resources/image?$queryString";

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

curl_close($ch);

header('Content-Type: application/json');

if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Curl error', 'message' => $curlError]);
    exit;
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['error' => 'Failed to fetch Cloudinary resources', 'http_code' => $httpCode, 'response' => $response]);
    exit;
}

echo $response;
