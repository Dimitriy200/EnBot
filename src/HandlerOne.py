import asyncio
import os

from aiogram import Bot, Dispatcher
from dotenv import load_dotenv

load_dotenv()

bot = Bot(os.getenv('TOKEN'))
dp = Dispatcher()


async def main():
    await dp.start_polling()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('BOT HAS KILLED')