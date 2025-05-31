import React, { createContext, useContext, useReducer, useEffect } from "react";
import { fileAPI, folderAPI } from "../services/api";
import socketService from "../services/socketService";
import toast from "react-hot-toast";

const FileContext = createContext();

const initialState = {
  files: [],
  folders: [],
  trashedItems: [],
  currentFolder: null,
  loading: false,
  uploading: false,
  uploadProgress: 0,
  selectedItems: [],
  viewMode: "grid",
  sortBy: "name",
  sortOrder: "asc",
};

const fileReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_UPLOADING":
      return { ...state, uploading: action.payload };
    case "SET_UPLOAD_PROGRESS":
      return { ...state, uploadProgress: action.payload };
    case "SET_FILES":
      return { ...state, files: action.payload };
    case "SET_FOLDERS":
      return { ...state, folders: action.payload };
    case "SET_TRASHED_ITEMS":
      return { ...state, trashedItems: action.payload };
    case "SET_CURRENT_FOLDER":
      return { ...state, currentFolder: action.payload };
    case "ADD_FILE":
      return { ...state, files: [...state.files, action.payload] };
    case "ADD_FOLDER":
      return { ...state, folders: [...state.folders, action.payload] };
    case "UPDATE_FILE":
      return {
        ...state,
        files: state.files.map((file) =>
          file._id === action.payload._id ? action.payload : file
        ),
      };
    case "UPDATE_FOLDER":
      return {
        ...state,
        folders: state.folders.map((folder) =>
          folder._id === action.payload._id ? action.payload : folder
        ),
      };
    case "MOVE_TO_TRASH":
      const { itemType, item } = action.payload;
      if (itemType === "file") {
        return {
          ...state,
          files: state.files.filter((file) => file._id !== item._id),
          trashedItems: [
            ...state.trashedItems,
            { ...item, type: "file", deletedAt: new Date() },
          ],
        };
      } else {
        return {
          ...state,
          folders: state.folders.filter((folder) => folder._id !== item._id),
          trashedItems: [
            ...state.trashedItems,
            { ...item, type: "folder", deletedAt: new Date() },
          ],
        };
      }
    case "RESTORE_FROM_TRASH":
      const restoredItem = action.payload;
      if (restoredItem.type === "file") {
        return {
          ...state,
          files: [...state.files, restoredItem],
          trashedItems: state.trashedItems.filter(
            (item) => item._id !== restoredItem._id
          ),
        };
      } else {
        return {
          ...state,
          folders: [...state.folders, restoredItem],
          trashedItems: state.trashedItems.filter(
            (item) => item._id !== restoredItem._id
          ),
        };
      }
    case "DELETE_PERMANENTLY":
      return {
        ...state,
        trashedItems: state.trashedItems.filter(
          (item) => item._id !== action.payload
        ),
      };
    case "EMPTY_TRASH":
      return {
        ...state,
        trashedItems: [],
      };
    case "SET_SELECTED_ITEMS":
      return { ...state, selectedItems: action.payload };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_SORT":
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };
    default:
      return state;
  }
};

export const FileProvider = ({ children }) => {
  const [state, dispatch] = useReducer(fileReducer, initialState);

  useEffect(() => {
    // Configurar listeners do WebSocket
    socketService.on("file-uploaded", (data) => {
      dispatch({ type: "ADD_FILE", payload: data.file });
      toast.success("Ficheiro enviado com sucesso!");
    });

    socketService.on("file-moved-to-trash", (data) => {
      dispatch({
        type: "MOVE_TO_TRASH",
        payload: { itemType: "file", item: data.file },
      });
      toast.info("Ficheiro movido para o lixo");
    });

    socketService.on("folder-moved-to-trash", (data) => {
      dispatch({
        type: "MOVE_TO_TRASH",
        payload: { itemType: "folder", item: data.folder },
      });
      toast.info("Pasta movida para o lixo");
    });

    socketService.on("item-restored", (data) => {
      dispatch({ type: "RESTORE_FROM_TRASH", payload: data.item });
      toast.success("Item restaurado com sucesso!");
    });

    return () => {
      socketService.off("file-uploaded");
      socketService.off("file-moved-to-trash");
      socketService.off("folder-moved-to-trash");
      socketService.off("item-restored");
    };
  }, []);

  const loadFiles = async (folderId = null) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      
      console.log('=== LOAD FILES ===');
      console.log('Folder ID:', folderId);
      
      // Adicionar delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const [filesResponse, foldersResponse] = await Promise.all([
        fileAPI.getFiles({ folderId }),
        folderAPI.getFolders({ parent: folderId }) // CORRIGIR: usar 'parent' em vez de 'parentId'
      ]);

      console.log('Files response:', filesResponse.data);
      console.log('Folders response:', foldersResponse.data);

      dispatch({ type: "SET_FILES", payload: filesResponse.data.files || [] });
      dispatch({ type: "SET_FOLDERS", payload: foldersResponse.data.folders || [] });
      dispatch({ type: "SET_CURRENT_FOLDER", payload: folderId });

      socketService.joinFolder(folderId);
    } catch (error) {
      console.error('Erro ao carregar ficheiros:', error);
      
      if (error.response?.status === 429) {
        toast.error("Muitas requisições. Aguarda um momento...");
        // Tentar novamente após 2 segundos
        setTimeout(() => loadFiles(folderId), 2000);
      } else {
        toast.error("Erro ao carregar ficheiros");
      }
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // CORRIGIR uploadFiles para retornar resultado
// Atualizar função uploadFiles no FileContext
const uploadFiles = async (filesData, folderId = null, preserveStructure = false) => {
  try {
    dispatch({ type: "SET_UPLOADING", payload: true });
    
    console.log('=== UPLOAD FILES WITH STRUCTURE ===');
    console.log('Files:', filesData.length);
    console.log('Folder ID:', folderId);
    console.log('Preserve Structure:', preserveStructure);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Se preserveStructure for true, criar estrutura de pastas primeiro
    if (preserveStructure && filesData.some(f => f.path && f.path.includes('/'))) {
      // Extrair e criar estrutura de pastas
      const folderPaths = new Set();
      
      filesData.forEach(fileObj => {
        if (fileObj.path && fileObj.path.includes('/')) {
          const pathParts = fileObj.path.split('/');
          pathParts.pop(); // Remover nome do ficheiro
          
          // Criar todos os caminhos de pasta necessários
          let currentPath = '';
          pathParts.forEach(part => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            folderPaths.add(currentPath);
          });
        }
      });
      
      // Criar pastas na ordem correta (mais superficiais primeiro)
      const sortedPaths = Array.from(folderPaths).sort((a, b) => 
        a.split('/').length - b.split('/').length
      );
      
      const folderMap = {}; // Mapear caminhos para IDs de pasta
      
      for (const folderPath of sortedPaths) {
        const pathParts = folderPath.split('/');
        const folderName = pathParts[pathParts.length - 1];
        
        // Determinar pasta pai
        let parentId = folderId;
        if (pathParts.length > 1) {
          const parentPath = pathParts.slice(0, -1).join('/');
          parentId = folderMap[parentPath];
        }
        
        try {
          console.log(`Creating folder: ${folderName} in parent: ${parentId}`);
          const result = await createFolder(folderName, '#3498db', parentId);
          
          if (result.success) {
            folderMap[folderPath] = result.folder._id;
          }
        } catch (error) {
          console.error(`Error creating folder ${folderPath}:`, error);
        }
      }
      
      // Agora fazer upload dos ficheiros para as pastas corretas
      for (const fileObj of filesData) {
        try {
          let targetFolderId = folderId;
          
          // Determinar pasta de destino baseada no caminho
          if (fileObj.path && fileObj.path.includes('/')) {
            const pathParts = fileObj.path.split('/');
            pathParts.pop(); // Remover nome do ficheiro
            const folderPath = pathParts.join('/');
            targetFolderId = folderMap[folderPath] || folderId;
          }
          
          const formData = new FormData();
          formData.append("file", fileObj.file);
          if (targetFolderId) formData.append("folderId", targetFolderId);

          console.log(`Uploading file: ${fileObj.name} to folder: ${targetFolderId}`);
          
          const response = await fileAPI.upload(formData, (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            dispatch({ type: "SET_UPLOAD_PROGRESS", payload: progress });
          });
          
          if (response.data.success) {
            successCount++;
          } else {
            errorCount++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (fileError) {
          console.error('Erro no upload do ficheiro:', fileObj.name, fileError);
          errorCount++;
        }
      }
    } else {
      // Upload normal sem estrutura
      for (const fileObj of filesData) {
        try {
          const formData = new FormData();
          formData.append("file", fileObj.file || fileObj);
          if (folderId) formData.append("folderId", folderId);

          const response = await fileAPI.upload(formData, (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            dispatch({ type: "SET_UPLOAD_PROGRESS", payload: progress });
          });
          
          if (response.data.success) {
            successCount++;
          } else {
            errorCount++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (fileError) {
          console.error('Erro no upload do ficheiro:', fileObj.name || fileObj.file?.name, fileError);
          errorCount++;
        }
      }
    }

    // Recarregar ficheiros
    await loadFiles(folderId);

    if (successCount > 0) {
      const structureMsg = preserveStructure ? ' (estrutura de pastas preservada)' : '';
      toast.success(`${successCount} ficheiro${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} com sucesso${structureMsg}!`);
    }
    
    if (errorCount > 0) {
      toast.error(`${errorCount} ficheiro${errorCount > 1 ? 's' : ''} falharam no upload`);
    }

    return { 
      success: successCount > 0, 
      successCount, 
      errorCount,
      message: `${successCount} ficheiros enviados com sucesso` 
    };

  } catch (error) {
    console.error('Erro geral no upload:', error);
    toast.error("Erro ao enviar ficheiros");
    return { success: false, error: error.message };
  } finally {
    dispatch({ type: "SET_UPLOADING", payload: false });
    dispatch({ type: "SET_UPLOAD_PROGRESS", payload: 0 });
  }
};


  const createFolder = async (name, color = '#3498db', parent = null) => {
    try {
      console.log('=== CREATE FOLDER CONTEXT ===');
      console.log('Name:', name);
      console.log('Color:', color);
      console.log('Parent:', parent);

      if (!name || typeof name !== 'string') {
        toast.error('Nome da pasta é obrigatório');
        return { success: false };
      }

      const folderData = {
        name: name.trim(),
        color: color || '#3498db',
        parent: parent || null
      };

      console.log('Sending folder data:', folderData);

      const response = await folderAPI.create(folderData);

      if (response.data.success) {
        toast.success('Pasta criada com sucesso!');
        return { success: true, folder: response.data.folder };
      } else {
        toast.error(response.data.message || 'Erro ao criar pasta');
        return { success: false };
      }
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar pasta');
      return { success: false };
    }
  };

  const loadTrash = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      console.log("A carregar lixo do backend...");
      const response = await fileAPI.getTrash();
      console.log("Resposta do lixo:", response.data);
      dispatch({
        type: "SET_TRASHED_ITEMS",
        payload: response.data.trashedItems || [],
      });
    } catch (error) {
      console.error("Erro ao carregar lixo:", error);
      toast.error("Erro ao carregar lixo");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const moveToTrash = async (item, itemType) => {
    try {
      console.log("=== MOVE TO TRASH DEBUG ===");
      console.log("Item:", item);
      console.log("Item Type:", itemType);

      if (itemType === "file") {
        const response = await fileAPI.moveToTrash(item._id);
        console.log("Resposta:", response);
      } else {
        const response = await folderAPI.moveToTrash(item._id);
        console.log("Resposta:", response);
      }

      dispatch({ type: "MOVE_TO_TRASH", payload: { itemType, item } });
      await loadTrash();
      toast.success(
        `${itemType === "file" ? "Ficheiro" : "Pasta"} movido para o lixo`
      );
    } catch (error) {
      console.error("=== ERRO MOVE TO TRASH ===");
      console.error("Error:", error);
      
      if (error.response?.status === 400 && itemType === "folder") {
        toast.error(
          `Não é possível mover a pasta "${item.name}" para o lixo porque contém ficheiros.`,
          { duration: 6000 }
        );
      } else {
        toast.error(
          `Erro ao mover ${itemType === "file" ? "ficheiro" : "pasta"} para o lixo: ${error.response?.data?.message || error.message}`
        );
      }
    }
  };

  const restoreFromTrash = async (item) => {
    try {
      if (item.type === "file") {
        await fileAPI.restoreFromTrash(item._id);
      } else {
        await folderAPI.restoreFromTrash(item._id);
      }

      dispatch({ type: "RESTORE_FROM_TRASH", payload: item });
      toast.success(
        `${item.type === "file" ? "Ficheiro" : "Pasta"} restaurado com sucesso!`
      );
    } catch (error) {
      toast.error("Erro ao restaurar item");
    }
  };

  const deletePermanently = async (item) => {
    try {
      if (item.type === "file") {
        await fileAPI.deletePermanently(item._id);
      } else {
        await folderAPI.deletePermanently(item._id);
      }

      dispatch({ type: "DELETE_PERMANENTLY", payload: item._id });
      toast.success(
        `${item.type === "file" ? "Ficheiro" : "Pasta"} eliminado permanentemente`
      );
    } catch (error) {
      toast.error("Erro ao eliminar permanentemente");
    }
  };

  const emptyTrash = async () => {
    try {
      await fileAPI.emptyTrash();
      dispatch({ type: "EMPTY_TRASH" });
      toast.success("Lixo esvaziado com sucesso!");
    } catch (error) {
      toast.error("Erro ao esvaziar lixo");
    }
  };

  const downloadFile = async (file) => {
    try {
      console.log('=== DOWNLOAD FILE FRONTEND ===');
      console.log('File object:', file);

      if (!file._id) {
        toast.error('ID do ficheiro não encontrado');
        return;
      }

      const response = await fileAPI.download(file._id);
      
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || file.mimetype
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let filename = file.originalName;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          filename = decodeURIComponent(filename);
        }
      }

      link.setAttribute('download', filename);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
      
    } catch (error) {
      console.error('=== ERRO DOWNLOAD FRONTEND ===');
      console.error('Error:', error);
      
      if (error.response?.status === 404) {
        toast.error('Ficheiro não encontrado');
      } else if (error.response?.status === 403) {
        toast.error('Não tens permissão para fazer download deste ficheiro');
      } else {
        toast.error('Erro ao fazer download do ficheiro');
      }
    }
  };

  // CORRIGIR moveItem para usar endpoints corretos
  const moveItem = async (itemId, itemType, targetFolderId) => {
    try {
      console.log('=== MOVE ITEM ===');
      console.log('Item ID:', itemId);
      console.log('Item Type:', itemType);
      console.log('Target Folder ID:', targetFolderId);

      let response;
      
      if (itemType === 'file') {
        // CORRIGIR: usar folderId em vez de targetFolderId para ficheiros
        response = await fileAPI.moveFile(itemId, targetFolderId);
      } else {
        // CORRIGIR: usar targetFolderId para pastas
        response = await folderAPI.moveToFolder(itemId, targetFolderId);
      }

      if (response.data.success) {
        toast.success(`${itemType === 'file' ? 'Ficheiro' : 'Pasta'} movido com sucesso!`);
        
        // Recarregar ficheiros da pasta atual
        await loadFiles(state.currentFolder);
        
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Erro ao mover item:', error);
      toast.error('Erro ao mover item');
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao mover item'
      };
    }
  };

  const shareFile = async (fileId, userEmail, permissions = 'read') => {
    try {
      await fileAPI.share(fileId, { userEmail, permissions });
      toast.success('Ficheiro partilhado com sucesso!');
      await loadFiles(state.currentFolder);
    } catch (error) {
      toast.error('Erro ao partilhar ficheiro');
    }
  };

  const value = {
    ...state,
    loadFiles,
    uploadFiles,
    createFolder,
    moveItem,
    loadTrash,
    moveToTrash,
    restoreFromTrash,
    deletePermanently,
    emptyTrash,
    downloadFile,
    shareFile,
    dispatch,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles deve ser usado dentro de FileProvider");
  }
  return context;
};
