from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="forjegames",
    version="1.0.0",
    description="Official Python SDK for the ForjeGames API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="ForjeGames",
    author_email="dev@forjegames.com",
    url="https://github.com/forjegames/sdk-python",
    license="MIT",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[],
    extras_require={
        "dev": ["pytest", "mypy", "black"],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Libraries",
        "Topic :: Games/Entertainment",
    ],
    keywords=["roblox", "forjegames", "sdk", "api", "game-development"],
)
