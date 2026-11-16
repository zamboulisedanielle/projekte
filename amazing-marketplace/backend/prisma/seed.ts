import { Book, OrderStatus, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BOOKS = [
  { title: 'Der Prozess', author: 'Franz Kafka', isbn: '9783150096760', publishedYear: 1925, description: 'Josef K. wird eines Morgens verhaftet, ohne zu wissen, warum.' },
  { title: 'Die Verwandlung', author: 'Franz Kafka', isbn: '9783150099648', publishedYear: 1915, description: 'Gregor Samsa erwacht als Ungeziefer.' },
  { title: 'Faust. Der Tragödie erster Teil', author: 'Johann Wolfgang von Goethe', isbn: '9783150000014', publishedYear: 1808, description: 'Der Gelehrte Faust schließt einen Pakt mit Mephisto.' },
  { title: 'Der Steppenwolf', author: 'Hermann Hesse', isbn: '9783518366752', publishedYear: 1927, description: 'Harry Haller zwischen bürgerlicher Welt und Einsamkeit.' },
  { title: 'Siddhartha', author: 'Hermann Hesse', isbn: '9783518366820', publishedYear: 1922, description: 'Die Suche eines jungen Brahmanen nach Erkenntnis.' },
  { title: 'Im Westen nichts Neues', author: 'Erich Maria Remarque', isbn: '9783462046335', publishedYear: 1929, description: 'Der Erste Weltkrieg aus der Sicht eines jungen Soldaten.' },
  { title: 'Die Blechtrommel', author: 'Günter Grass', isbn: '9783423118217', publishedYear: 1959, description: 'Oskar Matzerath beschließt, nicht mehr zu wachsen.' },
  { title: 'Das Parfum', author: 'Patrick Süskind', isbn: '9783257228007', publishedYear: 1985, description: 'Die Geschichte eines Mörders mit außergewöhnlichem Geruchssinn.' },
  { title: 'Der Vorleser', author: 'Bernhard Schlink', isbn: '9783257229530', publishedYear: 1995, description: 'Michael Berg und seine Liebe zu Hanna.' },
  { title: 'Tschick', author: 'Wolfgang Herrndorf', isbn: '9783499256356', publishedYear: 2010, description: 'Zwei Jugendliche, ein geklauter Lada, ein Sommer.' },
  { title: 'Die Känguru-Chroniken', author: 'Marc-Uwe Kling', isbn: '9783548372570', publishedYear: 2009, description: 'Ein kommunistisches Känguru zieht bei Marc-Uwe ein.' },
  { title: 'Qualityland', author: 'Marc-Uwe Kling', isbn: '9783548291284', publishedYear: 2017, description: 'Satire auf eine durchoptimierte Zukunft.' },
  { title: 'Der Schwarm', author: 'Frank Schätzing', isbn: '9783596164530', publishedYear: 2004, description: 'Das Meer schlägt zurück.' },
  { title: 'Unterleuten', author: 'Juli Zeh', isbn: '9783442715817', publishedYear: 2016, description: 'Ein Dorf in Brandenburg und seine Konflikte.' },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', publishedYear: 2008, description: 'Ein Handbuch für gute Softwareentwicklung.' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', isbn: '9780135957059', publishedYear: 2019, description: 'Vom Gesellen zum Meister der Softwareentwicklung.' },
  { title: 'Design Patterns', author: 'Erich Gamma u. a.', isbn: '9780201633610', publishedYear: 1994, description: 'Entwurfsmuster für wiederverwendbare Software.' },
  { title: 'Refactoring', author: 'Martin Fowler', isbn: '9780134757599', publishedYear: 2018, description: 'Bestehenden Code verbessern, ohne sein Verhalten zu ändern.' },
  { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', isbn: '9781593279509', publishedYear: 2018, description: 'Eine moderne Einführung in JavaScript.' },
  { title: 'Domain-Driven Design', author: 'Eric Evans', isbn: '9780321125217', publishedYear: 2003, description: 'Komplexität im Herzen der Software beherrschen.' },
  { title: 'Der kleine Prinz', author: 'Antoine de Saint-Exupéry', isbn: '9783792000361', publishedYear: 1943, description: 'Man sieht nur mit dem Herzen gut.' },
  { title: 'Momo', author: 'Michael Ende', isbn: '9783522202602', publishedYear: 1973, description: 'Ein Mädchen gegen die grauen Herren der Zeit.' },
  { title: 'Die unendliche Geschichte', author: 'Michael Ende', isbn: '9783522202077', publishedYear: 1979, description: 'Bastian liest sich nach Phantásien.' },
  { title: 'Krabat', author: 'Otfried Preußler', isbn: '9783522202107', publishedYear: 1971, description: 'Ein Junge in der Mühle des schwarzen Meisters.' },
];

// shop name -> [book index, price in cents, stock]
const SHOPS: { owner: number; name: string; city: string; description: string; offers: [number, number, number][] }[] = [
  {
    owner: 0, name: 'Bücherstube am Schlossplatz', city: 'Siegen',
    description: 'Klassiker und Gegenwartsliteratur, liebevoll ausgewählt.',
    offers: [[0, 600, 12], [1, 450, 20], [2, 500, 15], [3, 1100, 8], [4, 1000, 10], [5, 1200, 6], [6, 1400, 5], [7, 1300, 9], [8, 1100, 7], [13, 1200, 11]],
  },
  {
    owner: 0, name: 'Kinderbuchecke', city: 'Siegen',
    description: 'Geschichten für junge Leserinnen und Leser.',
    offers: [[20, 1000, 25], [21, 1500, 14], [22, 2000, 10], [23, 1400, 12], [9, 1200, 18]],
  },
  {
    owner: 1, name: 'Codebuch Köln', city: 'Köln',
    description: 'Fachbücher für Softwareentwicklung.',
    offers: [[14, 4299, 10], [15, 4599, 8], [16, 5299, 4], [17, 4999, 6], [18, 3299, 12], [19, 6499, 3]],
  },
  {
    owner: 1, name: 'Seitenwechsel', city: 'Bonn',
    description: 'Bestseller, Satire und Spannung.',
    offers: [[9, 1150, 10], [10, 1200, 22], [11, 1300, 15], [12, 1400, 9], [7, 1250, 5], [0, 650, 8]],
  },
];

const CUSTOMERS = [
  { email: 'kunde1@amazing.de', name: 'Lena Schäfer', street: 'Hölderlinstraße 3', zip: '57076', city: 'Siegen' },
  { email: 'kunde2@amazing.de', name: 'Jonas Becker', street: 'Ehrenstraße 41', zip: '50672', city: 'Köln' },
  { email: 'kunde3@amazing.de', name: 'Aylin Demir', street: 'Poppelsdorfer Allee 12', zip: '53115', city: 'Bonn' },
];

function orderNumber(date: Date, n: number) {
  return `AMZ-${date.toISOString().slice(0, 10).replace(/-/g, '')}-S${String(n).padStart(3, '0')}`;
}

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash('test123', 10);
  await prisma.user.create({
    data: { email: 'admin@amazing.de', name: 'Admin', role: Role.ADMIN, passwordHash: await bcrypt.hash('admin123', 10) },
  });
  const merchants = [
    await prisma.user.create({ data: { email: 'haendler1@amazing.de', name: 'Marie Hoffmann', role: Role.MERCHANT, passwordHash: pw } }),
    await prisma.user.create({ data: { email: 'haendler2@amazing.de', name: 'Tobias Wagner', role: Role.MERCHANT, passwordHash: pw } }),
  ];
  const customers = [];
  for (const c of CUSTOMERS) {
    customers.push({ ...c, user: await prisma.user.create({ data: { email: c.email, name: c.name, role: Role.CUSTOMER, passwordHash: pw } }) });
  }

  const books: Book[] = [];
  for (const b of BOOKS) books.push(await prisma.book.create({ data: b }));

  const offers: { id: number; shopId: number; bookId: number; priceCents: number }[] = [];
  for (const s of SHOPS) {
    const shop = await prisma.shop.create({
      data: { name: s.name, city: s.city, description: s.description, ownerId: merchants[s.owner].id },
    });
    for (const [bookIndex, priceCents, stock] of s.offers) {
      offers.push(await prisma.offer.create({ data: { shopId: shop.id, bookId: books[bookIndex].id, priceCents, stock } }));
    }
  }

  // Orders spread over the last 30 days so the dashboards have data.
  let seq = 1;
  let rnd = 42;
  const random = () => {
    rnd = (rnd * 16807) % 2147483647;
    return rnd / 2147483647;
  };
  const shopIds = [...new Set(offers.map((o) => o.shopId))];
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const ordersToday = Math.floor(random() * 3) + (daysAgo % 6 === 0 ? 1 : 0);
    for (let k = 0; k < ordersToday; k++) {
      const customer = customers[Math.floor(random() * customers.length)];
      const shopId = shopIds[Math.floor(random() * shopIds.length)];
      const shopOffers = offers.filter((o) => o.shopId === shopId);
      const picks = [...shopOffers].sort(() => random() - 0.5).slice(0, 1 + Math.floor(random() * 3));
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(9 + Math.floor(random() * 10), Math.floor(random() * 60), 0, 0);
      if (createdAt > new Date()) createdAt.setTime(Date.now() - (10 + Math.floor(random() * 120)) * 60_000);
      const items = picks.map((o) => {
        const book = books.find((b) => b.id === o.bookId)!;
        return { bookId: book.id, bookTitle: book.title, bookAuthor: book.author, unitPriceCents: o.priceCents, quantity: 1 + Math.floor(random() * 2) };
      });
      const processed = daysAgo > 3 || random() > 0.6;
      await prisma.order.create({
        data: {
          orderNumber: orderNumber(createdAt, seq++),
          customerId: customer.user.id,
          shopId,
          status: processed ? OrderStatus.PROCESSED : OrderStatus.OPEN,
          processedAt: processed ? createdAt : null,
          shippingName: customer.name,
          shippingStreet: customer.street,
          shippingZip: customer.zip,
          shippingCity: customer.city,
          totalCents: items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
          createdAt,
          items: { create: items },
        },
      });
    }
  }

  // Something in Lena's cart for the demo.
  await prisma.cartItem.create({ data: { userId: customers[0].user.id, offerId: offers[3].id, quantity: 1 } });
  await prisma.cartItem.create({ data: { userId: customers[0].user.id, offerId: offers[22].id, quantity: 1 } });

  console.log(`Seed fertig: ${books.length} Bücher, ${SHOPS.length} Shops, ${seq - 1} Bestellungen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
