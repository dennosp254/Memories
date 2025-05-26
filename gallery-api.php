<!-- <?php
header('Content-Type: application/json');

// Cloud accounts to query
$cloudAccounts = [
    [
        'cloudName' => 'dpmqdvjd4',
        'apiKey' => '293864622867266',
        'apiSecret' => 'dVpgW-o5cHW6CzGIoYtp6rPJguc'
    ],
    [
        'cloudName' => 'dhjkphmcc',
        'apiKey' => '566412233268355',
        'apiSecret' => 'yF5YkkgdEGwvpQuI4u_GpyWtHHA'
    ]
];

$folder = 'gallery';
$params = [
    'max_results' => 100000,
    'type' => 'upload',
];

$queryString = http_build_query($params);
$allImages = [];

foreach ($cloudAccounts as $account) {
    $cloudName = $account['cloudName'];
    $apiKey = $account['apiKey'];
    $apiSecret = $account['apiSecret'];

    $apiUrl = "https://api.cloudinary.com/v1_1/$cloudName/resources/image?$queryString";

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);

    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        // Continue even if one cloud fails, but log error
        error_log("Error from $cloudName: $curlError | HTTP $httpCode");
        continue;
    }

    $decoded = json_decode($response, true);
    if (isset($decoded['resources'])) {
        foreach ($decoded['resources'] as &$img) {
            $img['cloud_name'] = $cloudName; // Tag each image with its source
        }

        $allImages = array_merge($allImages, $decoded['resources']);
    }
}

// Return combined images from both clouds
echo json_encode(['resources' => $allImages]);
?> -->
