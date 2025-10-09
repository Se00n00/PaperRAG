import re
import fitz
import requests
from semanticscholar import SemanticScholar

sch = SemanticScholar()

def get_link(text: str) -> str:
    match = re.search(r'https?://[^\s,]+', text)
    
    if match:
        link = match.group(0)
        pdf_url = link.replace("/abs/", "/pdf/")
        return pdf_url
    else:
        return None
    
def get_papers(query:str):
    result = []
    try:
        response = sch.search_paper(query=query,limit=100)
        
        for item in response.items:
            names = [i['name'] for i in item["authors"]]
            authors = ", ".join(names)
            

            if (item['openAccessPdf']["url"] == "" and 'disclaimer' in item['openAccessPdf'].keys()):
                url = get_link(item['openAccessPdf']["disclaimer"])
            else:
                url = item['openAccessPdf']["url"]
                
            result.append(
                {
                    "urls":item["externalIds"],
                    "pdfs":url,
                    "year":item['year'],
                    "authors":authors,
                    "title":item['title'],
                    "abstract":item['abstract']
                }
            )
    except Exception as e:
        print(f"Error: {e}")
    
    return {"search_results":result}

def get_pdf_content(pdf_url:str):
    """
    Downloads a PDF from a URL and extracts its text content.
    """
    try:
        response = requests.get(pdf_url)
        response.raise_for_status()
        pdf_document = fitz.open(stream=response.content, filetype="pdf")
        
        text_content = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            text_content += page.get_text()
            
        return text_content
        
    except requests.exceptions.RequestException as e:
        print(f"Error downloading the PDF: {e}")
        return None
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return None