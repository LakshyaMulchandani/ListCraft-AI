/* ============================================================
   ListCraft AI — Platform Prompt Templates
   Specialized prompts for Etsy, eBay, and Amazon listings
   ============================================================ */

const Templates = (() => {
  /**
   * Build the product context string from form data
   */
  function _buildProductContext(data) {
    let ctx = `Product Name: ${data.productName}\n`;
    if (data.category) ctx += `Category: ${data.category}\n`;
    if (data.features) ctx += `Key Features & Materials: ${data.features}\n`;
    if (data.priceRange) ctx += `Price Range: ${data.priceRange}\n`;
    if (data.condition) ctx += `Condition: ${data.condition}\n`;
    if (data.tone) ctx += `Writing Tone: ${data.tone}\n`;
    if (data.extraNotes) ctx += `Additional Notes: ${data.extraNotes}\n`;
    return ctx.trim();
  }

  /**
   * Etsy prompt — optimized for handmade/vintage marketplace
   */
  function getEtsyPrompt(data) {
    const productContext = _buildProductContext(data);

    const system = `You are an expert Etsy listing copywriter who specializes in handmade, vintage, and unique products. You write compelling listings that tell a story and connect emotionally with buyers.

Your output MUST follow this EXACT format with these section headers (do not change the headers):

===TITLE===
(A compelling Etsy title, max 140 characters. Front-load the most important keywords. Use pipes or commas to separate keyword phrases.)

===DESCRIPTION===
(A rich, storytelling product description for Etsy. 150-300 words. Include:
- An engaging opening hook
- What makes this product special/unique
- Materials and dimensions
- How it can be used or styled
- Care instructions if applicable
- A warm closing that encourages purchase
Use short paragraphs for readability.)

===TAGS===
(Exactly 13 comma-separated tags. Each tag max 20 characters. Mix broad and specific keywords. These are critical for Etsy SEO.)

===BULLET_POINTS===
(5 key selling points as bullet points, each on its own line starting with "• ")`;

    const user = `Create an optimized Etsy listing for the following product:\n\n${productContext}`;

    return { system, user };
  }

  /**
   * eBay prompt — structured, specification-focused format
   */
  function getEbayPrompt(data) {
    const productContext = _buildProductContext(data);

    const system = `You are an expert eBay listing copywriter. You write clear, professional, and conversion-optimized product listings that emphasize specifications, value, and buyer confidence.

Your output MUST follow this EXACT format with these section headers (do not change the headers):

===TITLE===
(An eBay-optimized title, max 80 characters. Front-load the brand/product name and key specs. Use keywords buyers actually search for. Avoid filler words.)

===DESCRIPTION===
(A professional eBay product description. 100-250 words. Include:
- Clear product overview
- Detailed specifications in a structured format
- Condition details
- What's included in the package
- Shipping and return notes
- A confident call to action
Keep it scannable with short paragraphs and clear structure.)

===TAGS===
(10 comma-separated search keywords/phrases that eBay buyers would use. Focus on specific product attributes, brand names, and common search terms.)

===BULLET_POINTS===
(5 key item specifics as bullet points, each on its own line starting with "• ". Focus on specs: brand, size, material, color, compatibility, etc.)`;

    const user = `Create an optimized eBay listing for the following product:\n\n${productContext}`;

    return { system, user };
  }

  /**
   * Amazon prompt — SEO-heavy, A+ content style
   */
  function getAmazonPrompt(data) {
    const productContext = _buildProductContext(data);

    const system = `You are an expert Amazon product listing copywriter. You write highly SEO-optimized listings that maximize visibility in Amazon search and drive conversions.

Your output MUST follow this EXACT format with these section headers (do not change the headers):

===TITLE===
(An Amazon SEO-optimized title, max 200 characters. Format: Brand + Product Name + Key Feature + Material + Size/Quantity + Color. Pack with relevant keywords while remaining readable.)

===DESCRIPTION===
(A compelling Amazon product description. 150-300 words. Include:
- Clear value proposition in the first sentence
- Key benefits (not just features)
- Use cases and ideal customer
- Quality and material details
- Satisfaction guarantee or trust signals
Use HTML-free, clean formatting. Short paragraphs.)

===TAGS===
(15 comma-separated backend search terms. Include synonyms, alternate spellings, related terms, and long-tail keywords. No commas within individual tags. These are hidden search terms.)

===BULLET_POINTS===
(5 bullet points, each on its own line starting with "• ". Each bullet should:
- Start with a CAPITALIZED benefit keyword
- Follow with a feature explanation
- Be 100-200 characters long
Focus on benefits > features.)`;

    const user = `Create an optimized Amazon listing for the following product:\n\n${productContext}`;

    return { system, user };
  }

  /**
   * Get the prompt for a given platform
   * @param {'etsy'|'ebay'|'amazon'} platform
   * @param {Object} data - Product form data
   * @returns {{system: string, user: string}}
   */
  function getPrompt(platform, data) {
    switch (platform) {
      case 'etsy':
        return getEtsyPrompt(data);
      case 'ebay':
        return getEbayPrompt(data);
      case 'amazon':
        return getAmazonPrompt(data);
      default:
        return getEtsyPrompt(data);
    }
  }

  /**
   * Parse the AI response into structured sections
   * @param {string} text - Raw AI output
   * @returns {{title: string, description: string, tags: string[], bulletPoints: string[]}}
   */
  function parseResponse(text) {
    const sections = {
      title: '',
      description: '',
      tags: [],
      bulletPoints: [],
    };

    // Extract each section using the ===HEADER=== markers
    const titleMatch = text.match(/===TITLE===([\s\S]*?)(?====|$)/);
    const descMatch = text.match(/===DESCRIPTION===([\s\S]*?)(?====|$)/);
    const tagsMatch = text.match(/===TAGS===([\s\S]*?)(?====|$)/);
    const bulletsMatch = text.match(/===BULLET_POINTS===([\s\S]*?)(?====|$)/);

    if (titleMatch) {
      sections.title = titleMatch[1].trim();
    }

    if (descMatch) {
      sections.description = descMatch[1].trim();
    }

    if (tagsMatch) {
      sections.tags = tagsMatch[1]
        .trim()
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    if (bulletsMatch) {
      sections.bulletPoints = bulletsMatch[1]
        .trim()
        .split('\n')
        .map((b) => b.replace(/^[•\-\*]\s*/, '').trim())
        .filter((b) => b.length > 0);
    }

    return sections;
  }

  /**
   * Get platform display info
   */
  function getPlatformInfo(platform) {
    const info = {
      etsy: {
        name: 'Etsy',
        icon: '🧶',
        color: '#f97316',
        tagLabel: 'Tags (13 max)',
      },
      ebay: {
        name: 'eBay',
        icon: '🏷️',
        color: '#3b82f6',
        tagLabel: 'Search Keywords',
      },
      amazon: {
        name: 'Amazon',
        icon: '📦',
        color: '#f59e0b',
        tagLabel: 'Backend Search Terms',
      },
    };
    return info[platform] || info.etsy;
  }

  return {
    getPrompt,
    parseResponse,
    getPlatformInfo,
  };
})();
