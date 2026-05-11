import sys
f = open('android/app/build.gradle', 'r')
lines = f.readlines()
f.close()
lines = [l for l in lines if 'enableBundleCompression' not in l]
f = open('android/app/build.gradle', 'w')
f.writelines(lines)
f.close()
print('Silindi!')
