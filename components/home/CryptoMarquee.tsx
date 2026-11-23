
"use client";

import Script from "next/script";

export default function CryptoMarquee() {
  return (
    <div
      className="shadow-sm mt-16 rounded-lg overflow-hidden"
      style={{ backgroundColor: "#4d7de6" }}
    >
      <Script
        src="https://widgets.coingecko.com/coingecko-coin-price-marquee-widget.js"
        strategy="afterInteractive"
      />

      <coingecko-coin-price-marquee-widget
        coin-ids="bitcoin,ethereum,eos,ripple,litecoin"
        currency="usd"
        background-color="#ffffff"
        locale="en"
        font-color="#333333"
      />
    </div>
  );
}
