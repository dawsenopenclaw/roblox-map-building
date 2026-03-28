from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="robloxforge",
    version="1.0.0",
    description="Official Python SDK for the RobloxForge API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="RobloxForge",
    author_email="dev@robloxforge.com",
    url="https://github.com/robloxforge/sdk-python",
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
    keywords=["roblox", "robloxforge", "sdk", "api", "game-development"],
)
