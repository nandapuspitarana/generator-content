import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Menghapus data banner lama (opsional)...')
  // Hapus semua banner agar tidak dobel jika di-seed berkali-kali
  await prisma.banner.deleteMany({})

  console.log('Seeding Template Canvas Default...')

  const banners = [
    {
      name: 'Review Buku - Medium',
      format: 'MEDIUM',
      template: 'classic',
      title: 'Atomic Habits',
      author: 'James Clear',
      backgroundColor: '#e8e4dc',
      elements: JSON.stringify([
        {
          id: 'bg_accent',
          type: 'shape',
          x: 720, y: 0, w: 480, h: 675,
          bgColor: '#1c1c1c', zIndex: 1
        },
        {
          id: 'badge1',
          type: 'text',
          x: 60, y: 60, w: 200, h: 40,
          text: 'BOOK REVIEW',
          fontSize: 16, color: '#1c1c1c', fontWeight: '800', zIndex: 2
        },
        {
          id: 'title1',
          type: 'text',
          x: 60, y: 120, w: 550, h: 150,
          text: 'Atomic Habits',
          fontSize: 72, color: '#c8102e', fontWeight: '900', zIndex: 2
        },
        {
          id: 'author1',
          type: 'text',
          x: 60, y: 280, w: 400, h: 40,
          text: 'James Clear',
          fontSize: 24, color: '#4b5563', fontWeight: '500', zIndex: 2
        },
        {
          id: 'img1',
          type: 'image',
          x: 820, y: 90, w: 280, h: 420,
          src: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
          objectFit: 'cover', zIndex: 2
        },
        {
          id: 'tag1',
          type: 'shape',
          x: 60, y: 400, w: 120, h: 30,
          bgColor: '#e5e7eb', borderRadius: 15, zIndex: 1
        },
        {
          id: 'tag1_text',
          type: 'text',
          x: 70, y: 405, w: 100, h: 20,
          text: 'SELF-HELP',
          fontSize: 12, color: '#000000', fontWeight: 'bold', textAlign: 'center', zIndex: 2
        }
      ])
    },
    {
      name: 'Kutipan - Instagram Dark',
      format: 'INSTAGRAM',
      template: 'quote',
      backgroundColor: '#0f0f0f',
      elements: JSON.stringify([
        {
          id: 'quote_text',
          type: 'text',
          x: 100, y: 350, w: 880, h: 300,
          text: '"The only way to do great work is to love what you do."',
          fontSize: 64, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', zIndex: 2
        },
        {
          id: 'quote_author',
          type: 'text',
          x: 100, y: 700, w: 880, h: 60,
          text: '— Steve Jobs',
          fontSize: 32, color: '#a3a3a3', fontWeight: '500', textAlign: 'center', zIndex: 2
        },
        {
          id: 'shape1',
          type: 'shape',
          x: 440, y: 250, w: 200, h: 6,
          bgColor: '#3b82f6', zIndex: 1
        }
      ])
    },
    {
      name: 'Promosi Podcast - Instagram',
      format: 'INSTAGRAM',
      template: 'minimal',
      backgroundColor: '#ffffff',
      elements: JSON.stringify([
        {
          id: 'pod_title',
          type: 'text',
          x: 80, y: 150, w: 900, h: 200,
          text: 'EPISODE BARU MINGGU INI',
          fontSize: 80, color: '#111827', fontWeight: '900', zIndex: 2
        },
        {
          id: 'pod_sub',
          type: 'text',
          x: 80, y: 360, w: 800, h: 100,
          text: 'Ngobrol Santai Seputar AI & Masa Depan Konten Kreator',
          fontSize: 32, color: '#4b5563', fontWeight: '500', zIndex: 2
        },
        {
          id: 'listen_btn',
          type: 'shape',
          x: 80, y: 800, w: 300, h: 80,
          bgColor: '#000000', borderRadius: 40, zIndex: 1
        },
        {
          id: 'listen_txt',
          type: 'text',
          x: 80, y: 820, w: 300, h: 40,
          text: 'DENGARKAN SEKARANG',
          fontSize: 20, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', zIndex: 2
        },
        {
          id: 'pod_img',
          type: 'image',
          x: 600, y: 600, w: 400, h: 400,
          src: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800',
          objectFit: 'cover', zIndex: 1, borderRadius: 200
        }
      ])
    }
  ]

  for (const b of banners) {
    await prisma.banner.create({ data: b })
    console.log(`Berhasil membuat template: ${b.name}`)
  }

  console.log('Seeding selesai!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
