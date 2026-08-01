import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import Product from "./src/models/Product.model.js";
import User from "./src/models/User.model.js";

puppeteer.use(StealthPlugin());
dotenv.config();

const categories = {
  women: { query: "women clothing" },
  men: { query: "men clothing" },
  shoes: { query: "shoes" },
  bags: { query: "bags" },
  perfumes: { query: "perfumes" },
  accessories: { query: "fashion accessories" },
  lifestyle: { query: "lifestyle" },
  home: { query: "home decor" }
};

const brands = ["Myntra", "Flipkart", "H&M", "Meesho", "Ajio", "Pantaloons"];
const getRandomBrand = () => brands[Math.floor(Math.random() * brands.length)];

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 500;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - 1000 || totalHeight > 15000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 300);
        });
    });
}

async function extractProductsFromPage(page, minItems = 30) {
  // Wait for images to load
  await page.waitForSelector('img', { timeout: 10000 }).catch(() => {});
  
  // Scroll heavily to trigger lazy loading for 30+ items
  await autoScroll(page);
  await new Promise(r => setTimeout(r, 2000));

  const items = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const uniqueProducts = [];
    const seenTitles = new Set();
    
    for (let img of images) {
      const src = img.src || img.getAttribute('data-src') || '';
      
      // Exclude tiny icons, logos, trackers, and placeholder base64
      if (!src || src.includes('data:image') || src.length < 20 || src.includes('logo') || src.includes('icon') || src.includes('svg')) continue;
      
      // Heuristic to ensure it's a product image (they are usually larger)
      if (img.naturalWidth > 0 && img.naturalWidth < 100) continue;

      let title = img.alt || img.title || '';
      
      // Try to get title from parent anchor or sibling divs
      if (!title || title.length < 5) {
          const parent = img.closest('a');
          if (parent) {
              title = parent.title || parent.innerText.split('\n')[0];
          }
      }
      
      if (!title || title.length < 5 || title.toLowerCase().includes("flipkart") || title.toLowerCase().includes("myntra") || title.toLowerCase().includes("ajio")) continue;
      title = title.substring(0, 60).trim();
      
      if (seenTitles.has(title)) continue;
      seenTitles.add(title);
      
      // Try to find price nearby
      let price = null;
      let container = img.closest('a') || (img.parentElement ? img.parentElement.parentElement : null);
      if (container) {
        const textContent = container.innerText;
        if (textContent && (textContent.includes('₹') || textContent.includes('Rs'))) {
           // Match ₹1,999 or Rs. 1,999
           const match = textContent.match(/(?:₹|Rs\.?)\s*([0-9,]+)/);
           if (match) {
              price = parseInt(match[1].replace(/,/g, ''));
           }
        }
      }

      uniqueProducts.push({
        title,
        imgUrl: src.replace('?q=70', '?q=100').replace('w_200', 'w_600'), // Attempt to upgrade quality if it's an image API URL
        price: price || Math.floor(Math.random() * (4999 - 499) + 499)
      });
      
      if (uniqueProducts.length >= 40) break; // Buffer above 30
    }
    return uniqueProducts;
  });

  return items;
}

async function scrapeCategoryWithFallbacks(page, category, query) {
    const targets = [
        { name: "Myntra", url: `https://www.myntra.com/${query.replace(/ /g, '-')}` },
        { name: "Ajio", url: `https://www.ajio.com/search/?text=${encodeURIComponent(query)}` },
        { name: "Flipkart", url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}` }
    ];

    let allItems = [];

    for (const target of targets) {
        if (allItems.length >= 30) break;

        console.log(`  -> Trying ${target.name} at ${target.url}...`);
        try {
            await page.goto(target.url, { waitUntil: 'networkidle2', timeout: 35000 });
            const items = await extractProductsFromPage(page);
            console.log(`     Extracted ${items.length} items from ${target.name}.`);
            
            // Add new items, avoiding duplicates
            for (const item of items) {
                if (!allItems.some(i => i.title === item.title) && allItems.length < 35) {
                    allItems.push(item);
                }
            }
        } catch (err) {
            console.log(`     Failed or timed out on ${target.name}. Error: ${err.message.substring(0, 50)}`);
        }
    }

    return allItems;
}

const runScraper = async () => {
  let browser;
  try {
    await connectDB();
    console.log("Connected to DB, preparing to scrape 30+ products across platforms...");

    const seller = await User.findOne({ role: "seller" });
    if (!seller) {
      console.log("No seller found in DB, aborting seed.");
      process.exit();
    }

    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'] 
    });
    
    // Create page and set headers to look extremely normal
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    });

    // Remove existing products
    await Product.deleteMany({ seller: seller._id });
    console.log("Existing products deleted.");

    const newProducts = [];
    
    for (const [category, data] of Object.entries(categories)) {
        console.log(`\n--- Scraping category: ${category} ---`);
        const scrapedItems = await scrapeCategoryWithFallbacks(page, category, data.query);
        
        console.log(`Total collected for ${category}: ${scrapedItems.length}`);

        for (const item of scrapedItems) {
            const brand = getRandomBrand();
            newProducts.push({
                brandName: brand,
                productName: item.title,
                category: category,
                price: item.price,
                rating: (Math.random() * 2 + 3).toFixed(1),
                totalRatings: Math.floor(Math.random() * 500) + 10,
                discount: Math.floor(Math.random() * 50),
                salesCount: Math.floor(Math.random() * 1000),
                images: [item.imgUrl, item.imgUrl],
                variants: [
                    { size: "S", stock: Math.floor(Math.random() * 100) + 10 },
                    { size: "M", stock: Math.floor(Math.random() * 100) + 10 },
                    { size: "L", stock: Math.floor(Math.random() * 100) + 10 }
                ],
                seller: seller._id
            });
        }
    }

    if (newProducts.length > 0) {
        await Product.insertMany(newProducts);
        console.log(`\n✅ Successfully scraped and seeded ${newProducts.length} REAL products!`);
    } else {
        console.log("\n❌ Scraping failed completely.");
    }

  } catch (error) {
    console.error("Error during scraping:", error);
  } finally {
    if (browser) await browser.close();
    process.exit();
  }
};

runScraper();
