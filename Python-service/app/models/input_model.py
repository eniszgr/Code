from pydantic import BaseModel

class InputText(BaseModel): #DEFAULT JSON to Object model
    text: str
    # text: str = "varsayılan metin"  for default value

#convert json to object
#{"text":"sipariş verdim ama hata var"}
#InputText(text="sipariş verdim ama hata var")