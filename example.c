const int NUM_ROWS = 20;
const int NUM_COLUMNS = 20;
char data[NUM_ROWS * NUM_COLUMNS];

static const int actions[] = {2, 2, 2, 3, 4};
int count = 0;

int whatToDo() {
  if (count <= 4) {
    return actions[count++];
  }

  return 5;
}

int* getAddressOfData() { return &data[0]; }