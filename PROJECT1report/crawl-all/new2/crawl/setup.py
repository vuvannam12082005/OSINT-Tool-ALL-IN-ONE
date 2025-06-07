from setuptools import setup, find_packages

setup(
    name="metaspy",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "typer==0.9.0",
        "rich==13.7.0",
        "python-dotenv==1.0.0",
        "selenium==4.16.0",
        "click==8.1.7",
    ],
) 