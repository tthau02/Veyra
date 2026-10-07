from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class BaseResponse(BaseModel, Generic[DataT]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[DataT] = None
