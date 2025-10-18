# General Import
import os
import cv2
import keras
import numpy as np
import tensorflow as tf

# Data Loading
import pandas as pd
import tensorflow as tf
import tensorflow.data as tfd
import tensorflow.image as tfi

# Data Visualization
import plotly.express as px
import matplotlib.pyplot as plt

# Pre Trained Models
from tensorflow.keras.applications import ResNet50, ResNet50V2
from tensorflow.keras.applications import Xception, InceptionV3
from tensorflow.keras.applications import ResNet152, ResNet152V2
from tensorflow.keras.applications import EfficientNetB3, EfficientNetB5

# Outputs
from IPython.display import clear_output as cls

# Plotly Configuration
from plotly.offline import init_notebook_mode
init_notebook_mode(connected=True)


train_csv_path = "/kaggle/input/ai-vs-human-generated-dataset/train.csv"
test_csv_path = "/kaggle/input/ai-vs-human-generated-dataset/test.csv"
main_dir = "/kaggle/input/ai-vs-human-generated-dataset"
history_df_path = "/kaggle/input/ai-vs-human/tensorflow2/default/1/history_df.csv"


seed = 42
tf.random.set_seed(seed)